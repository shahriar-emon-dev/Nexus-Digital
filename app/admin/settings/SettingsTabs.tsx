"use client";

import { Globe, Plug } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IntegrationsPanel } from "./IntegrationsPanel";
import { SeoTagsPanel } from "./SeoTagsPanel";

/**
 * Real tabs rather than the source's `onclick="switchTab()"` pair, which
 * toggled a `hidden` class and left both panels in the accessibility tree with
 * no `aria-selected` on either button.
 */
export function SettingsTabs() {
  return (
    <Tabs defaultValue="integrations">
      <TabsList variant="underline" className="scrollbar-none overflow-x-auto">
        <TabsTrigger value="integrations">
          <Plug aria-hidden />
          API integrations
        </TabsTrigger>
        <TabsTrigger value="seo">
          <Globe aria-hidden />
          SEO &amp; marketing tags
        </TabsTrigger>
      </TabsList>

      <TabsContent value="integrations" className="mt-8">
        <IntegrationsPanel />
      </TabsContent>

      <TabsContent value="seo" className="mt-8">
        <SeoTagsPanel />
      </TabsContent>
    </Tabs>
  );
}
