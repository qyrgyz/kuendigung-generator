import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { createElement, forwardRef, useImperativeHandle } from 'react'
import { afterEach, vi } from 'vitest'

// RTL only auto-cleans when vitest globals are enabled; they are not here
afterEach(cleanup)

/** 1×1 PNG: what the fake signature pad below "draws". */
export const TEST_SIGNATURE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

// jsdom has no canvas, so the real signature pad cannot mount; a pointer-up on this stand-in counts as one stroke
vi.mock('react-signature-canvas', () => ({
  default: forwardRef(function FakeSignaturePad(
    props: { canvasProps?: Record<string, unknown>; onEnd?: () => void },
    ref,
  ) {
    useImperativeHandle(ref, () => ({ clear: () => {}, toDataURL: () => TEST_SIGNATURE }))
    return createElement('canvas', { ...props.canvasProps, onPointerUp: () => props.onEnd?.() })
  }),
}))
