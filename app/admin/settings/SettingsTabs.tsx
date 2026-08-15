"use client";

import * as React from "react";
import { Globe, Landmark, Plug } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeoTagsPanel } from "./SeoTagsPanel";
import { BillingPanel } from "./BillingPanel";
import type { SiteSettings } from "@/lib/supabase/site-settings-actions";

/**
 * Real tabs rather than the source's `onclick="switchTab()"` pair, which
 * toggled a `hidden` class and left both panels in the accessibility tree with
 * no `aria-selected` on either button.
 *
 * The integrations tab renders a server component passed in as a child, so
 * credential data is composed on the server and never crosses into this
 * client bundle.
 */
export function SettingsTabs({
  settings,
  integrations,
}: {
  settings: SiteSettings;
  integrations: React.ReactNode;
}) {
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
        <TabsTrigger value="billing">
          <Landmark aria-hidden />
          Payment details
        </TabsTrigger>
      </TabsList>

      <TabsContent value="integrations" className="mt-8">
        {integrations}
      </TabsContent>

      <TabsContent value="seo" className="mt-8">
        <SeoTagsPanel settings={settings} />
      </TabsContent>

      <TabsContent value="billing" className="mt-8">
        <BillingPanel settings={settings} />
      </TabsContent>
    </Tabs>
  );
}
