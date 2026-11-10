// src/tests/submission_actions.test.ts
// @vitest-environment node
//
// Tests for createSubmission, getSubmissionsByUser, updateSubmissionStatus.
// DB and markDraftOrdered are mocked — we're testing the action logic only,
// not Mongoose internals.

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock the DB model before importing the action ─────────────────────────────
const mockCreate           = vi.fn()
const mockFind             = vi.fn()
const mockFindByIdAndUpdate = vi.fn()

vi.mock('#/lib/database/submission.model', () => ({
  default: {
    create:            (...args: any[]) => mockCreate(...args),
    find:              (...args: any[]) => mockFind(...args),
    findByIdAndUpdate: (...args: any[]) => mockFindByIdAndUpdate(...args),
  },
}))

vi.mock('#/lib/database/mongoose', () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('#/lib/actions/design.actions', () => ({
  markDraftOrdered: vi.fn().mockResolvedValue(undefined),
}))

import {
  createSubmission,
  getSubmissionsByUser,
  updateSubmissionStatus,
  type CreateSubmissionParams,
} from '#/lib/actions/submission_actions'

// ── Shared fixture ────────────────────────────────────────────────────────────
const validParams: CreateSubmissionParams = {
  clerkId:  'user_abc123',
  designId: 'design_xyz',
  garment: {
    id:    'tshirt',
    name:  'Classic T-Shirt',
    color: { label: 'Black', hex: '#000000' },
    size:  'M',
  },
  sizeBreakdown: [
    { size: 'M', qty: 2 },
    { size: 'L', qty: 1 },
  ],
  totalPieces:  3,
  customer: {
    firstName: 'Ada',
    lastName:  'Obi',
    email:     'ada@example.com',
    whatsapp:  '+2348000000000',
    city:      'Lagos',
    state:     'Lagos',
  },
  acknowledged: true,
}

const mockDoc = {
  ...validParams,
  _id:       'submission_001',
  status:    'unprocessed',
  isPaid:    false,
  createdAt: new Date().toISOString(),
}

// ── createSubmission ──────────────────────────────────────────────────────────
describe('createSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreate.mockResolvedValue(mockDoc)
  })

  it('creates a submission with status unprocessed', async () => {
    const result = await createSubmission(validParams)
    expect(mockCreate).toHaveBeenCalledOnce()

    const callArg = mockCreate.mock.calls[0][0]
    expect(callArg.status).toBe('unprocessed')
    expect(callArg.isPaid).toBe(false)
  })

  it('passes all customer fields to the model', async () => {
    await createSubmission(validParams)
    const callArg = mockCreate.mock.calls[0][0]
    expect(callArg.customer.whatsapp).toBe('+2348000000000')
    expect(callArg.customer.email).toBe('ada@example.com')
  })

  it('throws if acknowledged is false', async () => {
    await expect(
      createSubmission({ ...validParams, acknowledged: false })
    ).rejects.toThrow('acknowledgement')
  })

  it('returns the created document', async () => {
    const result = await createSubmission(validParams)
    expect(result).toBeDefined()
    expect(result.status).toBe('unprocessed')
  })

  it('throws and re-throws if model.create fails', async () => {
    mockCreate.mockRejectedValue(new Error('DB connection lost'))
    await expect(createSubmission(validParams)).rejects.toThrow('DB connection lost')
  })
})

// ── getSubmissionsByUser ──────────────────────────────────────────────────────
describe('getSubmissionsByUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFind.mockReturnValue({
      sort: vi.fn().mockResolvedValue([mockDoc]),
    })
  })

  it('queries by clerkId', async () => {
    await getSubmissionsByUser('user_abc123')
    expect(mockFind).toHaveBeenCalledWith({ clerkId: 'user_abc123' })
  })

  it('returns an array of submissions', async () => {
    const results = await getSubmissionsByUser('user_abc123')
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBe(1)
  })

  it('returns empty array when user has no submissions', async () => {
    mockFind.mockReturnValue({ sort: vi.fn().mockResolvedValue([]) })
    const results = await getSubmissionsByUser('user_no_orders')
    expect(results).toEqual([])
  })
})

// ── updateSubmissionStatus ────────────────────────────────────────────────────
describe('updateSubmissionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates status to contacted', async () => {
    mockFindByIdAndUpdate.mockResolvedValue({ ...mockDoc, status: 'contacted' })
    const result = await updateSubmissionStatus('submission_001', 'contacted')
    expect(result.status).toBe('contacted')
  })

  it('calls findByIdAndUpdate with correct args', async () => {
    mockFindByIdAndUpdate.mockResolvedValue({ ...mockDoc, status: 'in_production' })
    await updateSubmissionStatus('submission_001', 'in_production')

    expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
      'submission_001',
      { $set: { status: 'in_production' } },
      { new: true }
    )
  })

  it('throws if submission is not found', async () => {
    mockFindByIdAndUpdate.mockResolvedValue(null)
    await expect(
      updateSubmissionStatus('nonexistent_id', 'delivered')
    ).rejects.toThrow('not found')
  })

  it('accepts all valid status values', async () => {
    const statuses = ['unprocessed', 'contacted', 'in_production', 'delivered'] as const
    for (const status of statuses) {
      mockFindByIdAndUpdate.mockResolvedValue({ ...mockDoc, status })
      const result = await updateSubmissionStatus('submission_001', status)
      expect(result.status).toBe(status)
    }
  })
})
