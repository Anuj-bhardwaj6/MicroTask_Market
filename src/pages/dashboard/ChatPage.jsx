import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiCheck, FiCheckCircle, FiPaperclip, FiSend, FiX } from "react-icons/fi";
import { Avatar } from "../../components/ui/Avatar.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { SkeletonLoader } from "../../components/ui/Skeleton.jsx";
import { EmptyState } from "../../components/common/EmptyState.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSocket } from "../../context/SocketContext.jsx";
import {
  useConversationsQuery,
  useMessagesQuery,
  useSendMessageMutation,
  useMarkConversationReadMutation,
  chatKeys,
} from "../../hooks/api/useChat.js";
import { useQueryClient } from "@tanstack/react-query";
import { formatFileSize, formatRelativeTime } from "../../utils/format.js";

const TYPING_STOP_DELAY = 2000;

function PresenceDot({ online }) {
  return (
    <span
      className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-ink-900 ${
        online ? "bg-emerald-500" : "bg-ink-300 dark:bg-ink-600"
      }`}
    />
  );
}

export function ChatPage() {
  usePageTitle("Messages");
  const { user } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { getSocket, isUserOnline } = useSocket();

  const conversationsQuery = useConversationsQuery();
  const conversations = conversationsQuery.data?.data?.conversations || [];

  const activeId = conversationId || conversations[0]?._id;
  const active = conversations.find((c) => c._id === activeId);

  // Land on the most recent thread if none was specified in the URL.
  useEffect(() => {
    if (!conversationId && conversations[0]?._id && user) {
      navigate(`/${user.role}/messages/${conversations[0]._id}`, { replace: true });
    }
  }, [conversationId, conversations, user, navigate]);

  const messagesQuery = useMessagesQuery(activeId);
  const messages = messagesQuery.data?.data?.messages || [];
  const sendMutation = useSendMessageMutation(activeId);
  const markReadMutation = useMarkConversationReadMutation();

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [typingUser, setTypingUser] = useState(false);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Join/leave the conversation's socket room as the selection changes.
  useEffect(() => {
    if (!activeId) return undefined;
    const socket = getSocket();
    socket?.emit("conversation:join", activeId);
    return () => socket?.emit("conversation:leave", activeId);
  }, [activeId, getSocket]);

  // Mark the open thread read (clears unread badge + emits read receipts).
  useEffect(() => {
    if (activeId && messages.length > 0) {
      markReadMutation.mutate(activeId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, messages.length]);

  // Realtime: new messages, typing indicator, and read receipts for the open thread.
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeId) return undefined;

    const handleNewMessage = (message) => {
      if (message.conversation !== activeId) return;
      queryClient.setQueryData(chatKeys.messages(activeId), (old) => {
        const list = old?.data?.messages || [];
        if (list.some((m) => m._id === message._id)) return old;
        return { ...old, data: { ...old.data, messages: [...list, message] } };
      });
      if (message.sender !== user?._id) {
        markReadMutation.mutate(activeId);
      }
    };

    const handleRead = ({ conversationId: readConvoId, readerId }) => {
      if (readConvoId !== activeId || readerId === user?._id) return;
      queryClient.setQueryData(chatKeys.messages(activeId), (old) => {
        const list = old?.data?.messages || [];
        return {
          ...old,
          data: {
            ...old.data,
            messages: list.map((m) =>
              m.readBy?.includes(readerId) ? m : { ...m, readBy: [...(m.readBy || []), readerId] }
            ),
          },
        };
      });
    };

    const handleTyping = ({ conversationId: typingConvoId, userId, isTyping }) => {
      if (typingConvoId !== activeId || userId === user?._id) return;
      setTypingUser(isTyping);
    };

    socket.on("message:new", handleNewMessage);
    socket.on("message:read", handleRead);
    socket.on("typing", handleTyping);
    return () => {
      socket.off("message:new", handleNewMessage);
      socket.off("message:read", handleRead);
      socket.off("typing", handleTyping);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, getSocket, user?._id]);

  useEffect(() => {
    setTypingUser(false);
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, typingUser]);

  const emitTyping = useCallback(
    (isTyping) => {
      if (!activeId) return;
      getSocket()?.emit(isTyping ? "typing:start" : "typing:stop", { conversationId: activeId });
    },
    [activeId, getSocket]
  );

  const handleTextChange = (e) => {
    setText(e.target.value);
    emitTyping(true);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), TYPING_STOP_DELAY);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && files.length === 0) return;
    clearTimeout(typingTimeoutRef.current);
    emitTyping(false);
    try {
      await sendMutation.mutateAsync({ text: text.trim(), attachments: files });
      setText("");
      setFiles([]);
    } catch {
      // surfaced via sendMutation.isError below
    }
  };

  const selectConversation = (id) => {
    navigate(`/${user.role}/messages/${id}`);
  };

  const otherOnline = active?.participant ? isUserOnline(active.participant._id) : false;

  return (
    <div className="grid min-h-[72vh] gap-6 xl:grid-cols-[360px_1fr]">
      <Card className="p-0">
        <div className="border-b p-4">
          <h2 className="font-semibold">Conversations</h2>
          <p className="text-sm text-ink-500">
            {conversations.length} {conversations.length === 1 ? "thread" : "threads"}
          </p>
        </div>
        {conversationsQuery.isLoading ? (
          <div className="p-4"><SkeletonLoader /></div>
        ) : conversations.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No conversations yet"
              message="Message a client or freelancer from a task page to start a thread."
            />
          </div>
        ) : (
          <div className="divide-y">
            {conversations.map((c) => (
              <button
                key={c._id}
                onClick={() => selectConversation(c._id)}
                className={`flex w-full gap-3 p-4 text-left hover:bg-ink-50 dark:hover:bg-ink-800 ${
                  c._id === activeId ? "bg-ink-50 dark:bg-ink-800" : ""
                }`}
              >
                <span className="relative shrink-0">
                  <Avatar src={c.participant?.avatar} name={c.participant?.name || "Unknown"} />
                  <PresenceDot online={c.participant ? isUserOnline(c.participant._id) : false} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <strong className="truncate text-sm">{c.participant?.name || "Unknown user"}</strong>
                    <span className="text-xs text-ink-500">{formatRelativeTime(c.lastMessageAt)}</span>
                  </span>
                  <span className="mt-1 block truncate text-sm text-ink-500">{c.lastMessage || "No messages yet"}</span>
                </span>
                {c.unreadCount > 0 ? (
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-xs text-white">
                    {c.unreadCount}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card className="flex flex-col p-0">
        {!active ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <EmptyState title="Select a conversation" message="Pick a thread on the left to see the messages." />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b p-4">
              <span className="relative shrink-0">
                <Avatar src={active.participant?.avatar} name={active.participant?.name || "Unknown"} />
                <PresenceDot online={otherOnline} />
              </span>
              <div>
                <h2 className="font-semibold">{active.participant?.name || "Unknown user"}</h2>
                <p className="text-sm text-brand-700 dark:text-brand-200">
                  {typingUser ? "Typing..." : otherOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
              {messagesQuery.isLoading ? (
                <SkeletonLoader />
              ) : messages.length === 0 ? (
                <p className="text-center text-sm text-ink-500">Say hello to get things started.</p>
              ) : (
                messages.map((message) => {
                  const isMine = message.sender === user?._id;
                  const isRead = isMine && active.participant && message.readBy?.includes(active.participant._id);
                  return (
                    <div key={message._id} className={`max-w-[78%] space-y-2 ${isMine ? "ml-auto" : ""}`}>
                      {message.text ? (
                        <div
                          className={`rounded-lg p-3 text-sm ${
                            isMine
                              ? "bg-ink-950 text-white dark:bg-white dark:text-ink-950"
                              : "bg-ink-100 dark:bg-ink-800"
                          }`}
                        >
                          {message.text}
                        </div>
                      ) : null}
                      {(message.attachments || []).length > 0 ? (
                        <div className="space-y-1">
                          {message.attachments.map((att) => (
                            <a
                              key={att._id}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center justify-between gap-3 rounded-lg border p-2 text-xs hover:bg-ink-50 dark:hover:bg-ink-800/60 ${
                                isMine ? "bg-ink-900/5" : ""
                              }`}
                            >
                              <span className="flex items-center gap-1 truncate">
                                <FiPaperclip className="h-3 w-3 shrink-0" /> {att.name}
                              </span>
                              <span className="shrink-0 text-ink-500">{formatFileSize(att.size)}</span>
                            </a>
                          ))}
                        </div>
                      ) : null}
                      <div className={`flex items-center gap-1 text-xs text-ink-400 ${isMine ? "justify-end" : ""}`}>
                        <span>{formatRelativeTime(message.createdAt)}</span>
                        {isMine ? (
                          isRead ? (
                            <FiCheckCircle className="h-3 w-3 text-brand-600" aria-label="Read" />
                          ) : (
                            <FiCheck className="h-3 w-3" aria-label="Sent" />
                          )
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
              {typingUser ? (
                <div className="max-w-[60%] rounded-lg bg-ink-100 p-3 text-sm text-ink-500 dark:bg-ink-800">...</div>
              ) : null}
            </div>

            <form onSubmit={handleSend} className="border-t p-4">
              {files.length > 0 ? (
                <div className="mb-2 flex flex-wrap gap-2">
                  {files.map((file, idx) => (
                    <span key={`${file.name}-${idx}`} className="flex items-center gap-1 rounded-md border px-2 py-1 text-xs">
                      <FiPaperclip className="h-3 w-3" /> {file.name}
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                        aria-label={`Remove ${file.name}`}
                      >
                        <FiX className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="flex items-center gap-2 rounded-lg border bg-white p-2 dark:bg-ink-900">
                <label className="cursor-pointer rounded-md p-2 hover:bg-ink-100 dark:hover:bg-ink-800" aria-label="Attach files">
                  <FiPaperclip />
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])}
                  />
                </label>
                <input
                  className="min-h-10 flex-1 bg-transparent px-2 text-sm outline-none"
                  placeholder="Write a message..."
                  value={text}
                  onChange={handleTextChange}
                />
                <Button type="submit" icon={FiSend} disabled={sendMutation.isPending || (!text.trim() && files.length === 0)}>
                  Send
                </Button>
              </div>
              {sendMutation.isError ? (
                <p className="mt-2 text-xs text-coral-600">{sendMutation.error?.message}</p>
              ) : null}
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
