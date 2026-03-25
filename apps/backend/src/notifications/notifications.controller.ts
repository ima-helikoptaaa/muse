import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ReminderType, ReminderStatus, Platform } from '@prisma/client';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get('reminders')
  listReminders(
    @Query('status') status?: ReminderStatus,
    @Query('type') type?: ReminderType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.listReminders({
      status,
      type,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('reminders')
  createReminder(
    @Body()
    body: {
      type: ReminderType;
      title: string;
      message: string;
      platform?: Platform;
      scheduledAt: string;
      metadata?: any;
    },
  ) {
    return this.notificationsService.createReminder({
      ...body,
      scheduledAt: new Date(body.scheduledAt),
    });
  }

  @Patch('reminders/:id/dismiss')
  dismissReminder(@Param('id') id: string) {
    return this.notificationsService.dismissReminder(id);
  }

  @Patch('reminders/:id/act')
  actOnReminder(@Param('id') id: string) {
    return this.notificationsService.actOnReminder(id);
  }

  @Post('reminders/process')
  processReminders() {
    return this.notificationsService.processReminders();
  }
}
