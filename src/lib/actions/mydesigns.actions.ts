// lib/actions/mydesigns.actions.ts
//
// Composite read for the /my-designs page — merges Design (drafts) and
// Order (paid) records into one feed, since a purchased design is really
// one Design row plus one Order row joined on designId, not two separate
// things the user thinks of separately.

import { getDraftsByUser } from './design.actions'
import { getOrdersByUser } from './order.actions'

export interface MyDesignCard {
  kind:         'draft' | 'ordered'
  designId:     string
  previewUrl:   string
  garmentName:  string
  colorHex:     string
  colorLabel:   string
  size:         string
  updatedAt:    string
  elementCount?: number   // draft only
  order?: {
    paystackRef: string
    totalPieces: number
    amountKobo:  number
    status:      'pending' | 'in_production' | 'quality_check' | 'shipped' | 'delivered'
  }
}

function cardFromDraft(d: any, order: any | undefined): MyDesignCard {
  return {
    kind:         order ? 'ordered' : 'draft',
    designId:     d.designId,
    previewUrl:   d.previewUrl ?? '',
    garmentName:  d.garment?.name  ?? 'Custom garment',
    colorHex:     d.garment?.color?.hex   ?? '#666',
    colorLabel:   d.garment?.color?.label ?? '',
    size:         d.garment?.size ?? '',
    updatedAt:    order?.updatedAt ?? d.updatedAt,
    elementCount: Array.isArray(d.elements) ? d.elements.length : undefined,
    order: order ? {
      paystackRef: order.paystackRef,
      totalPieces: order.totalPieces,
      amountKobo:  order.amount,
      status:      order.status,
    } : undefined,
  }
}

// An Order whose source Design is missing. Shouldn't normally happen —
// deleteDraft() refuses to delete a design once status is 'ordered' — but
// defends against manual DB edits or future migrations leaving one behind.
function cardFromOrphanOrder(o: any): MyDesignCard {
  return {
    kind:        'ordered',
    designId:    o.designId,
    previewUrl:  '',
    garmentName: o.garment?.name  ?? 'Custom garment',
    colorHex:    o.garment?.color?.hex   ?? '#666',
    colorLabel:  o.garment?.color?.label ?? '',
    size:        o.garment?.size ?? '',
    updatedAt:   o.updatedAt,
    order: {
      paystackRef: o.paystackRef,
      totalPieces: o.totalPieces,
      amountKobo:  o.amount,
      status:      o.status,
    },
  }
}

// ── GET MERGED FEED FOR USER ──────────────────────────────────────────────────
// Most recently updated first. Used by /my-designs.
export async function getMyDesignsFeed(clerkId: string): Promise<MyDesignCard[]> {
  const [drafts, orders] = await Promise.all([
    getDraftsByUser(clerkId),
    getOrdersByUser(clerkId),
  ])

  const orderByDesignId = new Map(orders.map((o: any) => [o.designId, o]))
  const draftIds         = new Set(drafts.map((d: any) => d.designId))

  const cards: MyDesignCard[] = [
    ...drafts.map((d: any) => cardFromDraft(d, orderByDesignId.get(d.designId))),
    ...orders.filter((o: any) => !draftIds.has(o.designId)).map(cardFromOrphanOrder),
  ]

  return cards.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}
