import { Request, Response, NextFunction } from "express";
import projectService from "../services/project.service";
import response from "../utils/response";
import { destroyImage, uploadBuffer } from "../utils/cloudinary-upload";
import { fetchRepoSnapshot } from "../services/github.service";
import { parseRequestBody } from "../utils/validation";
import {
  createProjectSchema,
  updateProjectSchema,
  CreateProjectInput,
  UpdateProjectInput,
} from "../schemas/project.schema";

const FOLDER = "open-source-kigali/projects";

async function findAllProjects(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const featured = _req.query.featured === "true" ? true : undefined;
    const projects = await projectService.findAllProjects(featured);
    response.success(res, projects, 200, "Projects retrieved successfully");
  } catch (err) {
    next(err);
  }
}

async function findProjectBySlug(
  req: Request<{ slug: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const project = await projectService.findProjectBySlug(req.params.slug);
    if (!project) return response.failure(res, "Project not found", 404);
    response.success(res, project, 200, "Project retrieved successfully");
  } catch (err) {
    next(err);
  }
}

async function addProject(req: Request, res: Response, next: NextFunction) {
  if (!req.file) return response.failure(res, "Image file is required", 400);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(req.body.slug)) {
    return response.failure(
      res,
      "slug must be lowercase alphanumeric with hyphens only",
      400,
    );
  }

  let publicId: string | undefined;
  try {
    const data = parseRequestBody<CreateProjectInput>(
      createProjectSchema,
      req.body,
      res,
    );
    if (!data) return;

    const uploaded = await uploadBuffer(req.file.buffer, FOLDER);
    publicId = uploaded.public_id;

    const created = await projectService.addProject({
      slug: data.slug,
      repoOwner: data.repoOwner,
      repoName: data.repoName,
      tagline: data.tagline,
      category: data.category,
      status: data.status,
      featured: data.featured,
      maintainer: data.maintainer ?? null,
      langColor: data.langColor ?? null,
      imageUrl: uploaded.secure_url,
      imagePublicId: uploaded.public_id,
    });

    let project = created;
    try {
      const snap = await fetchRepoSnapshot(created.repoOwner, created.repoName);
      project = await projectService.applyGithubSnapshot(created.id, snap);
    } catch {
      // best-effort: GitHub data can be filled in later via /refresh
    }

    response.success(res, project, 201, "Project created successfully");
  } catch (err) {
    if (publicId) await destroyImage(publicId);
    next(err);
  }
}

async function updateProject(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  let newPublicId: string | undefined;
  try {
    const existing = await projectService.findProjectById(req.params.id);
    if (!existing) return response.failure(res, "Project not found", 404);

    const data = parseRequestBody<UpdateProjectInput>(
      updateProjectSchema,
      req.body,
      res,
    );
    if (!data) return;

    const cleanedData: Record<string, unknown> = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "" && v !== undefined),
    );

    if (req.file) {
      const uploaded = await uploadBuffer(req.file.buffer, FOLDER);
      newPublicId = uploaded.public_id;
      cleanedData.imageUrl = uploaded.secure_url;
      cleanedData.imagePublicId = uploaded.public_id;
    }

    const updated = await projectService.updateProject(
      req.params.id,
      cleanedData,
    );

    if (req.file && existing.imagePublicId) {
      await destroyImage(existing.imagePublicId);
    }

    response.success(res, updated, 200, "Project updated successfully");
  } catch (err) {
    if (newPublicId) await destroyImage(newPublicId);
    next(err);
  }
}

async function deleteProject(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const existing = await projectService.findProjectById(req.params.id);
    if (!existing) return response.failure(res, "Project not found", 404);

    await projectService.deleteProject(req.params.id);
    if (existing.imagePublicId) await destroyImage(existing.imagePublicId);

    response.success(res, null, 204, "Project deleted successfully");
  } catch (err) {
    next(err);
  }
}

async function refreshAll(_req: Request, res: Response, next: NextFunction) {
  try {
    const projects = await projectService.findAllProjectsForRefresh();
    const results = await Promise.allSettled(
      projects.map(async (p) => {
        const snap = await fetchRepoSnapshot(p.repoOwner, p.repoName);
        await projectService.applyGithubSnapshot(p.id, snap);
        return p;
      }),
    );

    const summary = results.map((r, i) => {
      const p = projects[i];
      if (r.status === "fulfilled") {
        return { id: p.id, slug: p.slug, ok: true };
      }
      return {
        id: p.id,
        slug: p.slug,
        ok: false,
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      };
    });

    response.success(res, summary, 200, "Refresh completed");
  } catch (err) {
    next(err);
  }
}

export default {
  findAllProjects,
  findProjectBySlug,
  addProject,
  updateProject,
  deleteProject,
  refreshAll,
};
