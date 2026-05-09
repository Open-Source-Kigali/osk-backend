import { Request, Response, NextFunction } from "express";
import partnerService from "../services/partner.service";
import response from "../utils/response";
import { Partner } from "../generated/prisma/client";
import { destroyImage, uploadBuffer } from "../utils/cloudinary-upload";

type PartnerBody = Omit<Partner, "id" | "createdAt" | "updatedAt">;

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

async function addPartner(
  req: Request<unknown, unknown, Omit<PartnerBody, "logoUrl" | "logoPublicId">>,
  res: Response,
  next: NextFunction,
) {
  if (!req.file) {
    return response.failure(res, "Logo file is required", 400);
  }

  let publicId: string | undefined;
  try {
    const uploaded = await uploadBuffer(
      req.file.buffer,
      "open-source-kigali/partners",
    );
    publicId = uploaded.public_id;

    const newPartner = await partnerService.addPartner({
      ...req.body,
      logoUrl: uploaded.secure_url,
      logoPublicId: uploaded.public_id,
    });

    response.success(res, newPartner, 201, "Partner created successfully");
  } catch (err) {
    if (publicId) await destroyImage(publicId);
    next(err);
  }
}

async function updatePartner(
  req: Request<
    { id: string },
    unknown,
    Partial<Omit<PartnerBody, "logoPublicId">>
  >,
  res: Response,
  next: NextFunction,
) {
  let newPublicId: string | undefined;
  try {
    const existing = await partnerService.findPartnerById(req.params.id);
    if (!existing) return response.failure(res, "Partner not found", 404);

    const data: Partial<PartnerBody> = { ...req.body };

    if (req.file) {
      const uploaded = await uploadBuffer(
        req.file.buffer,
        "open-source-kigali/partners",
      );
      newPublicId = uploaded.public_id;
      data.logoUrl = uploaded.secure_url;
      data.logoPublicId = uploaded.public_id;
    }

    const updatedPartner = await partnerService.updatePartner(
      req.params.id,
      data,
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
