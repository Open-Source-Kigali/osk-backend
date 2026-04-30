import { Request, Response, NextFunction } from "express";
import partnerService from "../services/partner.service";
import response from "../utils/response";
import { Partner } from "../generated/prisma/client";

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
  req: Request<{}, {}, Omit<Partner, "id" | "createdAt" | "updatedAt">>,
  res: Response,
  next: NextFunction,
) {
  try {
    const newPartner = await partnerService.addPartner(req.body);
    response.success(res, newPartner, 201, "Partner created successfully");
  } catch (err) {
    next(err);
  }
}

async function updatePartner(
  req: Request<{ id: string }, {}, Partial<Omit<Partner, "id" | "createdAt" | "updatedAt">>>,
  res: Response,
  next: NextFunction,
) {
  try {
    const updatedPartner = await partnerService.updatePartner(
      req.params.id,
      req.body,
    );
    response.success(res, updatedPartner, 200, "Partner updated successfully");
  } catch (err) {
    next(err);
  }
}

async function deletePartner(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction,
) {
  try {
    await partnerService.deletePartner(req.params.id);
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
