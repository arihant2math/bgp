const SCREEN_READER_DELAY = 500

export interface CharacterCounterCallbacks {
  onCountUpdate: (count: number, isOverLimit: boolean, message: string) => void
  onScreenReaderAnnounce: (message: string) => void
}

export class CharacterCounter {
  private announceTimeout: number | null = null
  private callbacks: CharacterCounterCallbacks
  private isInitialLoad = true

  constructor(callbacks: CharacterCounterCallbacks) {
    this.callbacks = callbacks
  }

  updateCharacterCount(currentLength: number, maxLength: number): void {
    const charactersRemaining = maxLength - currentLength
    let message = ''

    if (charactersRemaining >= 0) {
      const characterText =
        charactersRemaining === 1 ? 'character' : 'characters'
      message = `${charactersRemaining} ${characterText} remaining`
      this.callbacks.onCountUpdate(charactersRemaining, false, message)
    } else {
      const charactersOver = -charactersRemaining
      const characterText = charactersOver === 1 ? 'character' : 'characters'
      message = `${charactersOver} ${characterText} over`
      this.callbacks.onCountUpdate(charactersOver, true, message)
    }

    if (!this.isInitialLoad) {
      this.announceToScreenReader(message)
    }

    if (this.isInitialLoad) {
      this.isInitialLoad = false
    }
  }

  private announceToScreenReader(message: string): void {
    if (this.announceTimeout) {
      clearTimeout(this.announceTimeout)
    }

    if (
      typeof window === 'undefined' ||
      typeof window.setTimeout !== 'function'
    ) {
      return
    }

    this.announceTimeout = window.setTimeout(() => {
      this.callbacks.onScreenReaderAnnounce(message)
    }, SCREEN_READER_DELAY)
  }

  cleanup(): void {
    if (this.announceTimeout) {
      clearTimeout(this.announceTimeout)
    }
  }
}
