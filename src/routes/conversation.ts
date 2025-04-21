import { Hono } from "hono";
import {
  createConversation,
  getAllConversations,
  getConversationMessage,
} from "../services/conversation.service";
import { getUserByToken } from "../services/user.service";
import { ClientType } from "../models/enums";

export const conversationRoute = new Hono<{ Bindings: Env }>();

conversationRoute.get("get-by-id/:conversationId", async (c) => {
  const conversationId = c.req.param("conversationId");

  // Nhận page và limit từ query param, mặc định nếu không truyền
  const page = parseInt(c.req.query("page") || "1", 10);
  const limit = parseInt(c.req.query("limit") || "10", 10);

  try {
    const { messages, totalCount } = await getConversationMessage(
      c.env,
      conversationId,
      page,
      limit
    );

    return c.json({
      messages,
      pagination: {
        page,
        limit,
        totalCount,
        hasMore: page * limit < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching/creating conversation:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

// conversationRoute.get("/:businessId", async (c) => {
//   const token = c.req.header("Authorization");
//   let userId: string | undefined;
//   let guestId: string | undefined;

//   if (token) {
//     const user = await getUserByToken(c.env, token);
//     if (user) {
//       userId = user.id;
//     }
//   }

//   const body = await c.req.json();
//   const businessId = c.req.param("businessId");

//   // Nếu không có token → tạo guestId tạm thời (ẩn danh)
//   if (!userId) {
//     // Nếu FE có gửi guestId (localStorage) thì dùng, còn không thì tự sinh
//     guestId = body.guestId ?? crypto.randomUUID();
//   }

//   if (!businessId) {
//     return c.json({ error: "Missing businessId" }, 400);
//   }

//   const data = {
//     businessId,
//     userId, // có thể undefined nếu là guest
//     guestId, // có thể undefined nếu là user
//     clientType: userId ? ClientType.AUTHENTICATED : ClientType.ANONYMOUS, // enum,
//   };

//   try {
//     const conversation = await createConversation(c.env, data);
//     return c.json({
//       conversationId: conversation.id,
//       guestId, // gửi lại FE để lưu vào localStorage (nếu là anonymous)
//     });
//   } catch (error) {
//     console.error("Error fetching/creating conversation:", error);
//     return c.json({ error: "Internal Server Error" }, 500);
//   }
// });

conversationRoute.get("all/:businessId", async (c) => {
  const businessId = c.req.param("businessId");
  const page = Number(c.req.query("page")) || 1;
  const limit = Number(c.req.query("limit")) || 10;
  if (!businessId) {
    return c.json({ error: "Missing conversationId" }, 400);
  }
  try {
    const conversation = await getAllConversations(
      c.env,
      businessId,
      page,
      limit
    );
    return c.json({ conversation });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

conversationRoute.post("/", async (c) => {
  const body = await c.req.json();
  const businessId = body.businessId;
  const userId = body.userId;
  const guestId = body.guestId;
  const clientType = body.clientType;
  const authHeader = c.req.header("Authorization");

  if (!businessId) {
    return c.json({ error: "Missing businessId" }, 400);
  }

  const data = {
    businessId,
    userId,
    guestId,
    clientType,
  };

  try {
    if (authHeader) {
      const user = await getUserByToken(c.env, authHeader);
      data.userId = user.id;
    }

    const conversation = await createConversation(c.env, data);
    return c.json({
      conversationId: conversation.id,
      guestId, // gửi lại FE để lưu vào localStorage (nếu là anonymous)
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});
