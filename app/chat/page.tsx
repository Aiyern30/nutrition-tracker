/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useState } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, AlertCircle, Settings, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedPrompts = [
  "What's a healthy breakfast for weight loss?",
  "Explain the nutrition facts of salmon",
  "Create a 1500 calorie meal plan",
  "How many calories in a chicken Caesar salad?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // Fetch existing messages
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (!error && data) {
          const formattedMessages: Message[] = data.map((msg: any) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            timestamp: new Date(msg.created_at),
          }));
          setMessages(formattedMessages);
        }
      }
    };

    initChat();
  }, [supabase]);

  const handleSendMessage = async () => {
    if (!input.trim() || !userId) return;

    const userMessageContent = input;
    setInput("");
    setIsLoading(true);

    try {
      // 1. Save user message to Supabase
      const { data: userMsgData, error: userMsgError } = await supabase
        .from("chat_messages")
        .insert({
          user_id: userId,
          role: "user",
          content: userMessageContent,
        })
        .select()
        .single();

      if (userMsgError) throw userMsgError;

      const newUserMessage: Message = {
        id: userMsgData.id,
        role: "user",
        content: userMessageContent,
        timestamp: new Date(userMsgData.created_at),
      };

      setMessages((prev) => [...prev, newUserMessage]);

      // 2. Get AI response from Flask backend
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, newUserMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();
      const aiContent = data.message || "I couldn't generate a response.";

      // 3. Save assistant message to Supabase
      const { data: aiMsgData, error: aiMsgError } = await supabase
        .from("chat_messages")
        .insert({
          user_id: userId,
          role: "assistant",
          content: aiContent,
        })
        .select()
        .single();

      if (aiMsgError) throw aiMsgError;

      const aiMessage: Message = {
        id: aiMsgData.id,
        role: "assistant",
        content: aiContent,
        timestamp: new Date(aiMsgData.created_at),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I encountered an error while processing your request. Please make sure the backend server (python app.py) is running on port 5000.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if (!userId) return;

    if (confirm("Are you sure you want to clear your chat history?")) {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("user_id", userId);

      if (!error) {
        setMessages([]);
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
              <h1 className="text-xl font-semibold">AI Chat</h1>
              <p className="text-sm text-muted-foreground">
                Ask nutrition questions and get AI-powered guidance
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                title="Clear Chat History"
                disabled={messages.length === 0}
              >
                <Trash2 className="h-5 w-5 text-muted-foreground hover:text-destructive" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex h-[calc(100vh-4rem)] flex-col">
          {/* Disclaimer Banner */}
          <div className="border-b bg-accent/5 px-6 py-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">
                Educational purposes only - Not medical advice
              </span>
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
                      Nutrition AI Assistant
                    </h2>
                    <p className="max-w-md text-muted-foreground">
                      Ask me anything about nutrition, meal planning, calorie
                      counting, or dietary advice. I'm here to help!
                    </p>
                  </div>
                </div>

                <div className="w-full max-w-2xl space-y-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Suggested questions:
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
                    className={`flex gap-4 ${message.role === "user" ? "justify-end" : ""
                      }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] space-y-2 rounded-2xl px-4 py-3 ${message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border"
                        }`}
                    >
                      <p className="text-sm leading-relaxed">
                        {message.content}
                      </p>
                      <p className="text-xs opacity-70">
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
                  placeholder="Ask about nutrition, meal ideas, or your diet..."
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
