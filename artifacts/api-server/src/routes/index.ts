import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import adminRouter from "./admin";
import businessRouter from "./business";
import knowledgeRouter from "./knowledge";
import whatsappRouter from "./whatsapp";
import conversationsRouter from "./conversations";
import contactsRouter from "./contacts";
import broadcastsRouter from "./broadcasts";
import analyticsRouter from "./analytics";
import billingRouter from "./billing";
import notificationsRouter from "./notifications";
import leadsRouter from "./leads";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(adminRouter);
router.use(businessRouter);
router.use(knowledgeRouter);
router.use(whatsappRouter);
router.use(conversationsRouter);
router.use(contactsRouter);
router.use(broadcastsRouter);
router.use(analyticsRouter);
router.use(billingRouter);
router.use(notificationsRouter);
router.use(leadsRouter);

export default router;
