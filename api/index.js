import app from '../backend/hono';

export default async (req, context) => {
  return app.fetch(req, {}, context);
};
