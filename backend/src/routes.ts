import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import appointmentsRoutes from './modules/appointments/appointments.routes';
import medicalRecordsRoutes from './modules/medicalRecords/medicalRecords.routes';
import prescriptionsRoutes from './modules/prescriptions/prescriptions.routes';
import insuranceRoutes from './modules/insurance/insurance.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import emergencyContactsRoutes from './modules/emergencyContacts/emergencyContacts.routes';
import remindersRoutes from './modules/reminders/reminders.routes';
import telemedicineRoutes from './modules/telemedicine/telemedicine.routes';
import healthAnalyticsRoutes from './modules/healthAnalytics/healthAnalytics.routes';
import clinicsRoutes from './modules/clinics/clinics.routes';
import chatRoutes from './modules/chat/chat.routes';
import queueRoutes from './modules/queue/queue.routes';
import importExportRoutes from './modules/importExport/importExport.routes';
import adminRoutes from './modules/admin/admin.routes';
import doctorsRoutes from './modules/doctors/doctors.routes';
import receptionistsRoutes from './modules/receptionists/receptionists.routes';
import { config } from './config/env';

const router = Router();

const apiPrefix = `/api/${config.apiVersion}`;

// Auth routes (Firebase-based)
router.use(`${apiPrefix}/auth`, authRoutes);
router.use(`${apiPrefix}/users`, usersRoutes);
router.use(`${apiPrefix}/appointments`, appointmentsRoutes);
router.use(`${apiPrefix}/medical-records`, medicalRecordsRoutes);
router.use(`${apiPrefix}/prescriptions`, prescriptionsRoutes);
router.use(`${apiPrefix}/insurance`, insuranceRoutes);
router.use(`${apiPrefix}/payments`, paymentsRoutes);
router.use(`${apiPrefix}/emergency-contacts`, emergencyContactsRoutes);
router.use(`${apiPrefix}/reminders`, remindersRoutes);
router.use(`${apiPrefix}/telemedicine`, telemedicineRoutes);
router.use(`${apiPrefix}/health-analytics`, healthAnalyticsRoutes);
router.use(`${apiPrefix}/clinics`, clinicsRoutes);
router.use(`${apiPrefix}/chat`, chatRoutes);
router.use(`${apiPrefix}/queue`, queueRoutes);
router.use(`${apiPrefix}/data`, importExportRoutes);
router.use(`${apiPrefix}/admin`, adminRoutes);
router.use(`${apiPrefix}/doctors`, doctorsRoutes);
router.use(`${apiPrefix}/receptionists`, receptionistsRoutes);

export default router;

