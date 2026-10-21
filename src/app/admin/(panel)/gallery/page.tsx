import type { Metadata } from "next";
import { GalleryManager, type GalleryItem } from "@/components/admin/content/gallery-manager";
import { getDb } from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery · Admin",
  robots: { index: false, follow: false },
};

export default async function AdminGalleryPage() {
  await requireAuth(PERMISSIONS.MEDIA_MANAGE);

  const items = getDb()
    .prepare(
      `SELECT id, title, category, image, alt, caption, sort_order, status
         FROM gallery_items
        ORDER BY sort_order, id`,
    )
    .all() as GalleryItem[];

  return <GalleryManager items={items} />;
}
