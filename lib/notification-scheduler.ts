import { db } from '@/lib/db';
import nodemailer from 'nodemailer';

// Cron parser function (simple implementation)
export function parseCronExpression(cronExpression: string): {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
} {
  const parts = cronExpression.split(' ');
  if (parts.length !== 5) {
    throw new Error('Invalid cron expression');
  }

  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4],
  };
}

// Check if a cron expression matches the current time
export function matchesCronTime(cronExpression: string, date: Date = new Date()): boolean {
  try {
    const cron = parseCronExpression(cronExpression);
    
    const minute = date.getMinutes();
    const hour = date.getHours();
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1; // JavaScript months are 0-based
    const dayOfWeek = date.getDay(); // 0 = Sunday

    // Check minute
    if (cron.minute !== '*' && parseInt(cron.minute) !== minute) {
      return false;
    }

    // Check hour
    if (cron.hour !== '*' && parseInt(cron.hour) !== hour) {
      return false;
    }

    // Check day of month
    if (cron.dayOfMonth !== '*' && parseInt(cron.dayOfMonth) !== dayOfMonth) {
      return false;
    }

    // Check month
    if (cron.month !== '*' && parseInt(cron.month) !== month) {
      return false;
    }

    // Check day of week
    if (cron.dayOfWeek !== '*' && parseInt(cron.dayOfWeek) !== dayOfWeek) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error parsing cron expression:', error);
    return false;
  }
}

// Replace template variables in message
export function replaceTemplateVariables(
  message: string,
  variables: { user: string; course: string }
): string {
  return message
    .replace(/{{user}}/g, variables.user)
    .replace(/{{course}}/g, variables.course);
}

// Send notification email
export async function sendNotificationEmail(
  to: string,
  subject: string,
  text: string
): Promise<boolean> {
  try {
    const smtpHost = process.env.SMTP_HOST || 'wordpress2502519.home.pl';
    const smtpPort = 587;
    const smtpSecure = false;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"Powiadomienie z ecurs" <${smtpUser}>`,
      to,
      subject,
      text,
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Process scheduled notifications and module publications
export async function processScheduledNotifications(): Promise<{
  processed: number;
  sent: number;
  errors: number;
  modulesPublished: number;
}> {
  console.log('Processing scheduled notifications and module publications...');
  
  let processed = 0;
  let sent = 0;
  let errors = 0;
  let modulesPublished = 0;

  try {
    // Get current time rounded to the nearest minute
    const currentTime = new Date();
    currentTime.setSeconds(0, 0);

    // 1. Process scheduled module publications
    try {
      const modulesToPublish = await db.module.findMany({
        where: {
          state: 0, // Draft state
          publishedAt: {
            lte: currentTime, // Publication time has passed
          },
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              authorId: true,
            },
          },
        },
      });

      console.log(`Found ${modulesToPublish.length} modules to publish`);

      for (const moduleToPublish of modulesToPublish) {
        try {
          await db.module.update({
            where: { id: moduleToPublish.id },
            data: {
              state: 1, // Set to published state
              publishedAt: null, // Clear the scheduled publication date
              updatedAt: currentTime,
            },
          });

          modulesPublished++;
          console.log(`Published module: ${moduleToPublish.title} (ID: ${moduleToPublish.id})`);
        } catch (moduleError) {
          console.error(`Error publishing module ${moduleToPublish.id}:`, moduleError);
          errors++;
        }
      }
    } catch (modulePublishError) {
      console.error('Error in module publication process:', modulePublishError);
      errors++;
    }

    // Find all enabled schedules
    const schedules = await db.notificationSchedule.findMany({
      where: {
        isEnabled: true,
      },
      include: {
        course: {
          include: {
            userCourses: {
              where: {
                state: 1, // Only enrolled students
              },
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        },
        author: {
          select: {
            firstName: true,
            lastName: true,
            displayName: true,
          },
        },
      },
    });

    console.log(`Found ${schedules.length} enabled notification schedules`);

    for (const schedule of schedules) {
      processed++;

      // Check if this schedule should run now
      if (!matchesCronTime(schedule.cronExpression, currentTime)) {
        console.log(`Schedule ${schedule.id} doesn't match current time`);
        continue;
      }

      // Check if we already sent this notification recently (within the last minute)
      const lastSent = schedule.lastSentAt;
      if (lastSent) {
        const timeDiff = currentTime.getTime() - lastSent.getTime();
        if (timeDiff < 60000) { // Less than 1 minute ago
          console.log(`Schedule ${schedule.id} was already sent recently`);
          continue;
        }
      }

      console.log(`Processing schedule ${schedule.id}: ${schedule.title}`);

      // Get enrolled students
      const enrolledStudents = schedule.course.userCourses;
      
      if (enrolledStudents.length === 0) {
        console.log(`No enrolled students for course ${schedule.course.title}`);
        continue;
      }

      // Send notifications to all enrolled students
      for (const userCourse of enrolledStudents) {
        const user = userCourse.user;
        const userName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
        
        try {
          // Replace template variables
          const personalizedMessage = replaceTemplateVariables(schedule.message, {
            user: userName,
            course: schedule.course.title,
          });

          // Send email
          const emailSent = await sendNotificationEmail(
            user.email,
            schedule.title,
            personalizedMessage
          );

          // Log the notification attempt
          await db.notificationSentLog.create({
            data: {
              notificationScheduleId: schedule.id,
              recipientEmail: user.email,
              recipientUserId: user.id,
              status: emailSent ? 'SENT' : 'FAILED',
              errorMessage: emailSent ? null : 'Failed to send email',
            },
          });

          if (emailSent) {
            sent++;
            console.log(`Sent notification to ${user.email}`);
          } else {
            errors++;
            console.log(`Failed to send notification to ${user.email}`);
          }
        } catch (error) {
          errors++;
          console.error(`Error sending notification to ${user.email}:`, error);
          
          // Log the error
          await db.notificationSentLog.create({
            data: {
              notificationScheduleId: schedule.id,
              recipientEmail: user.email,
              recipientUserId: user.id,
              status: 'FAILED',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            },
          });
        }
      }

      // Update the lastSentAt timestamp
      await db.notificationSchedule.update({
        where: { id: schedule.id },
        data: { lastSentAt: currentTime },
      });
    }

    console.log(`Processing complete. Notifications - Processed: ${processed}, Sent: ${sent}. Modules published: ${modulesPublished}. Errors: ${errors}`);
    
    return { processed, sent, errors, modulesPublished };
  } catch (error) {
    console.error('Error processing scheduled notifications:', error);
    throw error;
  }
}