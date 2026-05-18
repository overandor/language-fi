import { Router, type IRouter } from "express";
import healthRouter from "./health";
import lettersRouter from "./letters";
import analyticsRouter from "./analytics";
import kpiRouter from "./kpi";

const router: IRouter = Router();

router.use(healthRouter);
router.use(lettersRouter);
router.use(analyticsRouter);
router.use("/kpi", kpiRouter);

export default router;
