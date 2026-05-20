import { Response } from "express";

function success<T>(
  res: Response,
  data: T,
  status: number = 200,
  message: string = "Success",
) {
  if (status === 204) {
    // HTTP 204 responses must not include a message body.
    return res.status(status).end();
  }

  return res.status(status).json({ success: true, message, data });
}

function failure(res: Response, message: string, status: number = 400) {
  return res.status(status).json({ success: false, message, data: null });
}

export default { success, failure };
