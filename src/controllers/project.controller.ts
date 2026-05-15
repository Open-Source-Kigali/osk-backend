import { Request, Response, NextFunction } from "express";
import projectService from "../services/project.service";
import response from "../utils/response";
import { ProjectStatus } from "../generated/prisma/client";
import { destroyImage, uploadBuffer } from "../utils/cloudinary-upload";
import { fetchRepoSnapshot } from "../services/github.service";

const FOLDER = "open-source-kigali/projects";

type CreateBody = {
  slug: string;
  repoOwner: string;
  repoName: string;
  tagline: string;
  category: string;
  status?: ProjectStatus;
  featured?: string | boolean;
  maintainer?: string;
  langColor?: string;
};

type UpdateBody = Partial<CreateBody>;

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true" || value === "1";
  return undefined;
}

async function findAllProjects(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const projects = await projectService.findAllProjects();
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

async function addProject(
  req: Request<unknown, unknown, CreateBody>,
  res: Response,
  next: NextFunction,
) {
  if (!req.file) return response.failure(res, "Image file is required", 400);

  let publicId: string | undefined;
  try {
    const uploaded = await uploadBuffer(req.file.buffer, FOLDER);
    publicId = uploaded.public_id;

    const featured = parseBoolean(req.body.featured) ?? false;
    const created = await projectService.addProject({
      slug: req.body.slug,
      repoOwner: req.body.repoOwner,
      repoName: req.body.repoName,
      tagline: req.body.tagline,
      category: req.body.category,
      status: req.body.status ?? "active",
      featured,
      maintainer: req.body.maintainer ?? null,
      langColor: req.body.langColor ?? null,
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
  req: Request<{ id: string }, unknown, UpdateBody>,
  res: Response,
  next: NextFunction,
) {
  let newPublicId: string | undefined;
  try {
    const existing = await projectService.findProjectById(req.params.id);
    if (!existing) return response.failure(res, "Project not found", 404);

    const data: Record<string, unknown> = {};
    const b = req.body;
    if (b.slug) data.slug = b.slug;
    if (b.repoOwner) data.repoOwner = b.repoOwner;
    if (b.repoName) data.repoName = b.repoName;
    if (b.tagline) data.tagline = b.tagline;
    if (b.category) data.category = b.category;
    if (b.status) data.status = b.status;
    if (b.featured !== undefined) data.featured = parseBoolean(b.featured);
    if (b.maintainer !== undefined) data.maintainer = b.maintainer;
    if (b.langColor !== undefined) data.langColor = b.langColor;

    if (req.file) {
      const uploaded = await uploadBuffer(req.file.buffer, FOLDER);
      newPublicId = uploaded.public_id;
      data.imageUrl = uploaded.secure_url;
      data.imagePublicId = uploaded.public_id;
    }

    const updated = await projectService.updateProject(req.params.id, data);

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
