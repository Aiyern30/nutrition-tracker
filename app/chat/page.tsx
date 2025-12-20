/* eslint-disable react/no-unescaped-entities */
"use client";
import { useRouter } from "next/navigation";

import { useEffect, useState, type MouseEvent } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Bot,
  User,
  AlertCircle,
  Settings,
  Trash2,
  History,
  MessageSquare,
  CalendarDays,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useLanguage } from "@/contexts/language-context";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocalizedMetadata } from "@/hooks/use-localized-metadata";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export default function ChatPage() {
  useLocalizedMetadata({ page: "chat" });

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { language, t } = useLanguage();

  // Use prompts from translation, ensuring it defaults to an empty array if undefined
  const suggestedPrompts = Array.isArray(t.chat?.prompts) ? t.chat.prompts : [];

  useEffect(() => {
    const initUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        fetchConversations(user.id);
      }
    };
    initUser();
  }, [supabase]);

  const fetchConversations = async (uid: string) => {
    // Select only metadata, not the heavy messages array
    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setConversations(data);
    }
  };

  const loadConversation = async (conversationId: string) => {
    if (!userId) return;
    setIsLoading(true);
    setCurrentConversationId(conversationId);

    // Fetch specifically the messages for this conversation
    const { data, error } = await supabase
      .from("conversations")
      .select("messages")
      .eq("id", conversationId)
      .single();

    if (!error && data) {
      // Parse timestamp strings back to Date objects
      const loadedMessages: Message[] = (data.messages as any[]).map(
        (msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })
      );
      setMessages(loadedMessages);
      setIsHistoryOpen(false);
    }
    setIsLoading(false);
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setIsHistoryOpen(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !userId) return;

    const userMessageContent = input;
    setInput("");
    setIsLoading(true);

    const newUserMessage: Message = {
      id: Date.now().toString(), // Temp ID
      role: "user",
      content: userMessageContent,
      timestamp: new Date(),
    };

    // Optimistically update UI
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    try {
      let conversationId = currentConversationId;
      let finalMessages = updatedMessages;

      // 1. Get AI Response First
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          language: language,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response from AI");

      const data = await response.json();
      const aiContent = data.message || "I couldn't generate a response.";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiContent,
        timestamp: new Date(),
      };

      finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      // 2. Save to Supabase (Single Table Update)
      if (!conversationId) {
        // Create NEW conversation in single table
        const title =
          userMessageContent.slice(0, 40) +
          (userMessageContent.length > 40 ? "..." : "");

        const { data: convData, error: convError } = await supabase
          .from("conversations")
          .insert({
            user_id: userId,
            title: title,
            messages: finalMessages,
          })
          .select()
          .single();

        if (convError) throw convError;

        setCurrentConversationId(convData.id);
        fetchConversations(userId);
      } else {
        // Update EXISTING conversation by replacing messages array
        const { error: updateError } = await supabase
          .from("conversations")
          .update({
            messages: finalMessages,
            updated_at: new Date().toISOString(),
          })
          .eq("id", conversationId);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: t.chat.errorResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (e: MouseEvent, conversationId: string) => {
    e.stopPropagation(); // Prevent loading the chat when clicking delete
    if (!userId) return;

    if (confirm("Delete this conversation permanently?")) {
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (!error) {
        fetchConversations(userId);
        if (currentConversationId === conversationId) {
          startNewChat();
        }
      }
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex flex-1 items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{t.chat.title}</h1>
              <p className="text-sm text-muted-foreground">{t.chat.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <Sheet open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" title="View History">
                    <History className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle>{t.chat.history}</SheetTitle>
                    <SheetDescription>
                      {t.chat.historySubtitle}
                    </SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                    <div className="space-y-2 pr-4">
                      {conversations.map((conv) => (
                        <div
                          key={conv.id}
                          onClick={() => loadConversation(conv.id)}
                          className={`group flex items-center justify-between rounded-lg p-3 text-sm cursor-pointer border transition-all ${
                            currentConversationId === conv.id
                              ? "bg-primary/10 border-primary/20"
                              : "hover:bg-muted border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="flex flex-col overflow-hidden">
                              <span className="truncate font-medium">
                                {conv.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(conv.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => deleteConversation(e, conv.id)}
                          >
                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      ))}
                      {conversations.length === 0 && (
                        <div className="text-center text-muted-foreground py-10 opacity-50">
                          <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          {t.chat.noHistory}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              <Button
                variant="default"
                size="sm"
                onClick={startNewChat}
                className="gap-2"
              >
                <span className="text-xs">{t.chat.newChat}</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex h-[calc(100vh-4rem)] flex-col">
          {/* Disclaimer Banner */}
          <div className="border-b bg-accent/5 px-6 py-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">{t.chat.disclaimer}</span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center space-y-8">
                <div className="flex flex-col items-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-semibold">
                      {t.chat.assistantTitle}
                    </h2>
                    <p className="max-w-md text-muted-foreground">
                      {t.chat.assistantSubtitle}
                    </p>
                  </div>
                </div>

                <div className="w-full max-w-2xl space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t.chat.suggestedQuestions}
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {suggestedPrompts.map((prompt, i) => (
                      <Card
                        key={i}
                        className="cursor-pointer transition-colors hover:bg-accent/5"
                        onClick={() => handlePromptClick(prompt)}
                      >
                        <CardContent className="p-4">
                          <p className="text-sm">{prompt}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.role === "user" ? "justify-end" : ""
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] space-y-2 rounded-2xl px-5 py-4 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-card border shadow-sm"
                      }`}
                    >
                      <div
                        className={
                          message.role === "assistant"
                            ? "prose prose-sm dark:prose-invert max-w-none text-foreground"
                            : ""
                        }
                      >
                        {message.role === "assistant" ? (
                          <>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => (
                                  <p className="mb-2 last:mb-0 leading-relaxed text-foreground">
                                    {children}
                                  </p>
                                ),
                                ul: ({ children }) => (
                                  <ul className="mb-2 space-y-1 list-disc pl-4 text-foreground">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="mb-2 space-y-1 list-decimal pl-4 text-foreground">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="text-sm pl-1">{children}</li>
                                ),
                                h1: ({ children }) => (
                                  <h1 className="text-base font-bold mb-2 mt-3 text-foreground">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-sm font-bold mb-1 mt-2 text-foreground">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-xs font-bold mb-1 mt-2 uppercase tracking-wide text-muted-foreground">
                                    {children}
                                  </h3>
                                ),
                                strong: ({ children }) => (
                                  <span className="font-bold text-foreground">
                                    {children}
                                  </span>
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-2 border-primary pl-3 my-2 italic text-muted-foreground">
                                    {children}
                                  </blockquote>
                                ),
                                code: ({ children }) => (
                                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
                                    {children}
                                  </code>
                                ),
                              }}
                            >
                              {message.content.replace(
                                "[ACTION:NavigateToMealPlanner]",
                                ""
                              )}
                            </ReactMarkdown>
                            {message.content.includes(
                              "[ACTION:NavigateToMealPlanner]"
                            ) && (
                              <Button
                                variant="outline"
                                className="mt-3 w-full justify-start gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary"
                                onClick={() => router.push("/meal-planner")}
                              >
                                <CalendarDays className="h-4 w-4" />
                                {t.chat.goToMealPlanner}
                              </Button>
                            )}
                          </>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}
                      </div>
                      <p
                        className={`text-[10px] opacity-50 mt-2 ${
                          message.role === "user" ? "text-right" : "text-left"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20">
                        <User className="h-5 w-5 text-accent" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="max-w-[80%] space-y-2 rounded-2xl border bg-card px-4 py-3">
                      <div className="flex gap-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t bg-background p-4">
            <div className="mx-auto max-w-3xl">
              <div className="flex gap-3">
                <Input
                  placeholder={t.chat.inputPlaceholder}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
