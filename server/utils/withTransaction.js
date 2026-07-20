import mongoose from "mongoose";

// Runs `work(session)` inside a MongoDB multi-document transaction so a
// chain of writes across Task/Application/Notification either all commit
// or all roll back together.
//
// Local/dev MongoDB is often a standalone instance (no replica set), which
// does not support transactions at all. Rather than hard-failing the whole
// hiring flow in that environment, we detect that specific error and fall
// back to running the same work without a session - every write still
// happens, just without the atomicity guarantee. On any real deployment
// (replica set / Atlas), the transaction path is used.
export async function withTransaction(work) {
  const session = await mongoose.startSession();
  try {
    let result;
    try {
      await session.withTransaction(async () => {
        result = await work(session);
      });
      return result;
    } catch (err) {
      const unsupported =
        err?.code === 20 ||
        err?.codeName === "IllegalOperation" ||
        /Transaction numbers are only allowed|Transactions are not supported|replica set/i.test(
          err?.message || ""
        );
      if (!unsupported) throw err;
      console.warn(
        "[db] multi-document transactions aren't supported on this MongoDB deployment (standalone instance) - running the same writes without a session:",
        err.message
      );
      return await work(null);
    }
  } finally {
    await session.endSession();
  }
}

export default withTransaction;
