"use client";
import Image from "next/image";
import { User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";

interface ProfileHeaderProps {
  displayName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  createdAt: string;
  language: string;
}

export function ProfileHeader({
  displayName,
  userEmail,
  userAvatarUrl,
  createdAt,
  language,
}: ProfileHeaderProps) {
  const { t } = useLanguage();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
            {userAvatarUrl ? (
              <Image
                alt=""
                width={96}
                height={96}
                src={userAvatarUrl}
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="h-12 w-12" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <h2 className="text-2xl font-bold">
              {t.profile.welcome}, {displayName || "User"}
            </h2>
            {userEmail && (
              <p className="text-sm text-muted-foreground">{userEmail}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {t.profile.memberSince}{" "}
              {new Date(createdAt).toLocaleDateString(
                language === "zh" ? "zh-CN" : "en-US",
                {
                  month: "long",
                  year: "numeric",
                }
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
