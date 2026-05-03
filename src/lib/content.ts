export function decodeBase64Content(content: string) {
    const binary = atob(content.replace(/\s/g, ""));
    const bytes = Uint8Array.from(binary, (character) =>
        character.charCodeAt(0),
    );

    return new TextDecoder().decode(bytes);
}
