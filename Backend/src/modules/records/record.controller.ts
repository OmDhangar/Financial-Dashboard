// src/modules/records/record.controller.ts
import { Request, Response, NextFunction } from 'express';
import { recordService } from './record.service';
import { apiResponse } from '../../../common/response/ApiResponse';
import { CreateRecordDto, UpdateRecordDto, ListRecordsQuery } from './record.schema';

export class RecordController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListRecordsQuery;
      const { records, total } = await recordService.listRecords(query);
      res.status(200).json(apiResponse.paginated(records, Number(query.page), Number(query.limit), total));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await recordService.getRecordById(req.params.id);
      res.status(200).json(apiResponse.success(record));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await recordService.createRecord(req.user!.id, req.body as CreateRecordDto);
      res.status(201).json(apiResponse.success(record));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await recordService.updateRecord(req.params.id, req.body as UpdateRecordDto);
      res.status(200).json(apiResponse.success(record));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await recordService.deleteRecord(req.params.id);
      res.status(200).json(apiResponse.success({ message: 'Record deleted successfully' }));
    } catch (error) {
      next(error);
    }
  }
}

export const recordController = new RecordController();
