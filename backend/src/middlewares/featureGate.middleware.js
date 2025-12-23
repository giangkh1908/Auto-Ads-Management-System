import {
  describeFeature,
  FEATURE_KEYS,
  getUserEntitlements,
  userHasFeature,
} from "../services/admin/entitlementService.js";

export const attachEntitlements = async (req, _res, next) => {
  try {
    if (!req.user?._id) return next();
    if (req.entitlements) return next();
    const entitlements = await getUserEntitlements(req.user._id);
    req.entitlements = entitlements;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      const entitlements = req.entitlements
        ? req.entitlements
        : await getUserEntitlements(req.user?._id);
      const hasAccess = await userHasFeature(req.user?._id, featureKey, {
        entitlements,
      });

      if (!hasAccess) {
        const featureLabel = describeFeature(featureKey);
        return res.status(403).json({
          success: false,
          message: `Nhắc nhở: Gói hiện tại của bạn không bao gồm tính năng ${featureLabel}.`,
          required_feature: featureKey,
        });
      }

      req.entitlements = entitlements;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export { FEATURE_KEYS };

