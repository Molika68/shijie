import {
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Query,
} from '@nestjs/common';
import { HistoryService } from './history.service';

@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  list(
    @Headers('authorization') auth: string | undefined,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('type') type?: string,
  ) {
    const token = auth?.replace('Bearer ', '');
    return this.historyService.list(
      token,
      Number(page) || 1,
      Number(size) || 20,
      type,
    );
  }

  @Get(':id')
  getById(
    @Param('id') id: string,
    @Headers('authorization') auth?: string,
  ) {
    const token = auth?.replace('Bearer ', '');
    return this.historyService.getById(id, token);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Headers('authorization') auth?: string,
  ) {
    const token = auth?.replace('Bearer ', '');
    return this.historyService.remove(id, token);
  }
}
