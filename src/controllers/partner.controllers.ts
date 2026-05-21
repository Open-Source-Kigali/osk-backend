import { Request, Response, NextFunction } from "express";
import partnerService from "../services/partner.service";
import response from "../utils/response";
import { Partner } from "../generated/prisma/client";
import { destroyImage, uploadBuffer } from "../utils/cloudinary-upload";
import { parseRequestBody } from "../utils/validation";
import { trimStrings } from "../utils/trim-strings";
import {
  createPartnerSchema,
  updatePartnerSchema,
  CreatePartnerInput,
  UpdatePartnerInput,
} from "../schemas/partner.schema";

type PartnerBody = Omit<Partner, "id" | "createdAt" | "updatedAt">;

/**
 * Fetches all partners from the database.
 */
async function findAllPartners(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const allPartners = await partnerService.findAllPartners();
    response.success(res, allPartners, 200, "Partners retrieved successfully");
  } catch (err) {
    next(err);
  }
}

/**
 * Fetches a single partner by their ID.
 */
async function findPartnerById(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const partner = await partnerService.findPartnerById(req.params.id);
    if (!partner) {
      return response.failure(res, "Partner not found", 404);
    }
    return response.success(
      res,
      partner,
      200,
      "Partner retrieved successfully",
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Trims input strings and adds a new partner.
 * Validates against Zod schema after trimming.
 */
async function addPartner(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    return response.failure(res, "Logo file is required", 400);
  }

  let publicId: string | undefined;
  try {
    // Automatically trim all string inputs before validation/saving
    const trimmedBody = trimStrings(req.body as Record<string, unknown>);

    const data = parseRequestBody<CreatePartnerInput>(
      createPartnerSchema,
      trimmedBody,
      res,
    );
    if (!data) return;

    const uploaded = await uploadBuffer(
      req.file.buffer,
      "open-source-kigali/partners",
    );
    publicId = uploaded.public_id;

    const newPartner = await partnerService.addPartner({
      ...data,
      logoUrl: uploaded.secure_url,
      logoPublicId: uploaded.public_id,
    });

    response.success(res, newPartner, 201, "Partner created successfully");
  } catch (err) {
    if (publicId) await destroyImage(publicId);
    next(err);
  }
}

/**
 * Trims input strings and updates an existing partner.
 */
async function updatePartner(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  let newPublicId: string | undefined;
  try {
    const existing = await partnerService.findPartnerById(req.params.id);
    if (!existing) return response.failure(res, "Partner not found", 404);

    // Automatically trim all string inputs before validation/updating
    const trimmedBody = trimStrings(req.body as Record<string, unknown>);

    const data = parseRequestBody<UpdatePartnerInput>(
      updatePartnerSchema,
      trimmedBody,
      res,
    );
    if (!data) return;

    // Filter out empty strings or undefined values that shouldn't be updated
    const cleanedData: Partial<PartnerBody> = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "" && v !== undefined),
    ) as Partial<PartnerBody>;

    if (req.file) {
      const uploaded = await uploadBuffer(
        req.file.buffer,
        "open-source-kigali/partners",
      );
      newPublicId = uploaded.public_id;
      cleanedData.logoUrl = uploaded.secure_url;
      cleanedData.logoPublicId = uploaded.public_id;
    }

    const updatedPartner = await partnerService.updatePartner(
      req.params.id,
      cleanedData,
    );

    if (req.file && existing.logoPublicId) {
      await destroyImage(existing.logoPublicId);
    }

    response.success(res, updatedPartner, 200, "Partner updated successfully");
  } catch (err) {
    if (newPublicId) await destroyImage(newPublicId);
    next(err);
  }
}

/**
 * Deletes a partner by their ID.
 */
async function deletePartner(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    const existing = await partnerService.findPartnerById(req.params.id);
    if (!existing) return response.failure(res, "Partner not found", 404);

    await partnerService.deletePartner(req.params.id);
    if (existing.logoPublicId) await destroyImage(existing.logoPublicId);

    response.success(res, null, 204, "Partner deleted successfully");
  } catch (err) {
    next(err);
  }
}

export default {
  findAllPartners,
  findPartnerById,
  addPartner,
  updatePartner,
  deletePartner,
};
