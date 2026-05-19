import { Request, Response } from 'express';
import { contributorsService } from '../services/contributors.service';
import { response } from '../utils/response';

const getContributors = async (_req: Request, res: Response) => {
  try {
    const contributors = await contributorsService.readContributors();
    return response.success(res, contributors);
  } catch (err) {
    return response.failure(res, 'Failed to read contributors', 500);
  }
};

const refresh = async (_req: Request, res: Response) => {
  try {
    const summary = await contributorsService.refreshContributors();
    return response.success(res, summary);
  } catch (err) {
    return response.failure(res, 'Failed to refresh contributors', 500);
  }
};

export const contributorsController = { getContributors, refresh };
