import { Request, Response, NextFunction } from "express";
import partnerApplicationService from "../services/partner-application.service";
import response from "../utils/response";
import { ApplicationStatus } from "../generated/prisma/client";
import { destroyImage, uploadBuffer } from "../utils/cloudinary-upload";
import trimStrings from "../utils/trim-strings";
import { parseRequestBody } from "../utils/validation";
import {
  createPartnerApplicationSchema,
  updateApplicationStatusSchema,
  UpdateApplicationStatusInput,
} from "../schemas/partner-application.schema";

const FOLDER = "open-source-kigali/partner-applications";

async function findAllPartnerApplications(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const applications =
      await partnerApplicationService.findAllPartnerApplications();
    response.success(
      res,
      applications,
      200,
      "Partner applications retrieved successfully",
    );
  } catch (err) {
    next(err);
  }
}

async function findPartnerApplicationById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const application =
      await partnerApplicationService.findPartnerApplicationById(req.params.id);
    if (!application) {
      return response.failure(res, "Partner application not found", 404);
    }
    return response.success(
      res,
      application,
      200,
      "Partner application retrieved successfully",
    );
  } catch (err) {
    next(err);
  }
}

async function addPartnerApplication(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.file) {
    return response.failure(res, "Organisation logo file is required", 400);
  }

  let publicId: string | undefined;
  try {
    const data = parseRequestBody(
      createPartnerApplicationSchema,
      trimStrings(req.body as Record<string, unknown>),
      res,
    );
    if (!data) return;

    const uploaded = await uploadBuffer(req.file.buffer, FOLDER);
    publicId = uploaded.public_id;

    const newApplication =
      await partnerApplicationService.addPartnerApplication({
        organisationName: data.organisationName,
        organisationType: data.organisationType,
        website: data.website,
        organisationSize: data.organisationSize,
        country: data.country,
        description: data.description,
        partnershipTier: data.partnershipTier,
        organisationOffer: data.organisationOffer,
        projectIdea: data.projectIdea ?? null,
        fullName: data.fullName,
        jobTitle: data.jobTitle,
        workEmail: data.workEmail,
        agreedToTerms: data.agreedToTerms,
        organisationLogoUrl: uploaded.secure_url,
        organisationLogoPublicId: uploaded.public_id,
      });

    response.success(
      res,
      newApplication,
      201,
      "Partner application submitted successfully",
    );
  } catch (err) {
    if (publicId) await destroyImage(publicId);
    next(err);
  }
}

async function updatePartnerApplicationStatus(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const existing =
      await partnerApplicationService.findPartnerApplicationByIdInternal(
        req.params.id,
      );
    if (!existing) {
      return response.failure(res, "Partner application not found", 404);
    }

    const data = parseRequestBody<UpdateApplicationStatusInput>(
      updateApplicationStatusSchema,
      trimStrings(req.body as Record<string, unknown>),
      res,
    );
    if (!data) return;

    const updated =
      await partnerApplicationService.updatePartnerApplicationStatus(
        req.params.id,
        data.status as ApplicationStatus,
      );

    response.success(
      res,
      updated,
      200,
      "Partner application status updated successfully",
    );
  } catch (err) {
    next(err);
  }
}

async function deletePartnerApplication(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const existing =
      await partnerApplicationService.findPartnerApplicationByIdInternal(
        req.params.id,
      );
    if (!existing) {
      return response.failure(res, "Partner application not found", 404);
    }

    await partnerApplicationService.deletePartnerApplication(req.params.id);
    if (existing.organisationLogoPublicId) {
      await destroyImage(existing.organisationLogoPublicId);
    }

    response.success(
      res,
      null,
      204,
      "Partner application deleted successfully",
    );
  } catch (err) {
    next(err);
  }
}

export default {
  findAllPartnerApplications,
  findPartnerApplicationById,
  addPartnerApplication,
  updatePartnerApplicationStatus,
  deletePartnerApplication,
};
