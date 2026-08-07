import { createAvatar } from "@dicebear/core";
import {
  adventurer as loadAdventurer,
  botttsNeutral as loadBotttsNeutral,
  croodlesNeutral as loadCroodlesNeutral,
  openPeeps as loadOpenPeeps,
  pixelArt as loadPixelArt,
} from "@dicebear/collection/async";

export type UserAvatarOption = {
  value: string;
  label: string;
};

export type UserAvatarGroup = {
  value: string;
  label: string;
  avatars: UserAvatarOption[];
};

type AvatarStyle =
  | "pixelArt"
  | "adventurer"
  | "botttsNeutral"
  | "croodlesNeutral"
  | "openPeeps";

type AvatarDefinition = UserAvatarOption & {
  style: AvatarStyle;
  seed: string;
  backgroundColor: string;
};

const backgroundColors = [
  "f5f0e8",
  "d9eee9",
  "f5e5c8",
  "d6d1c9",
  "f1d9cf",
  "d5e4d8",
];

const avatarGroupDefinitions = [
  { value: "pixel_art", label: "Pixel Art", style: "pixelArt" },
  { value: "adventurer", label: "Adventurer", style: "adventurer" },
  {
    value: "bottts_neutral",
    label: "Bottts Neutral",
    style: "botttsNeutral",
  },
  {
    value: "croodles_neutral",
    label: "Croodles Neutral",
    style: "croodlesNeutral",
  },
  { value: "open_peeps", label: "Open Peeps", style: "openPeeps" },
] as const;

const avatarDefinitions: AvatarDefinition[] = avatarGroupDefinitions.flatMap(
  (group) =>
    backgroundColors.map((backgroundColor, index) => {
      const sequence = String(index + 1).padStart(2, "0");
      return {
        value: `avatar_${group.value}_${sequence}`,
        label: `${group.label} ${sequence}`,
        style: group.style,
        seed: `myoj-${group.value}-${sequence}`,
        backgroundColor,
      };
    })
);

export const USER_AVATAR_GROUPS: UserAvatarGroup[] = avatarGroupDefinitions.map(
  (group) => ({
    value: group.value,
    label: group.label,
    avatars: avatarDefinitions
      .filter((avatar) => avatar.style === group.style)
      .map(({ value, label }) => ({ value, label })),
  })
);

export const USER_AVATARS = USER_AVATAR_GROUPS.flatMap(
  (group) => group.avatars
);
export const DEFAULT_USER_AVATAR = USER_AVATARS[0].value;

const avatarDefinitionMap = new Map<string, AvatarDefinition>(
  avatarDefinitions.map((definition) => [definition.value, definition])
);
const avatarSourceCache = new Map<string, string>();
const avatarSourcePromiseCache = new Map<string, Promise<string>>();

export const normalizeUserAvatar = (avatar?: string) =>
  avatar && avatarDefinitionMap.has(avatar) ? avatar : DEFAULT_USER_AVATAR;

const createAvatarSource = async (definition: AvatarDefinition) => {
  const options = {
    seed: definition.seed,
    backgroundColor: [definition.backgroundColor],
    radius: 50,
    size: 128,
  };

  switch (definition.style) {
    case "adventurer":
      return createAvatar(await loadAdventurer(), options).toDataUri();
    case "botttsNeutral":
      return createAvatar(await loadBotttsNeutral(), options).toDataUri();
    case "croodlesNeutral":
      return createAvatar(await loadCroodlesNeutral(), options).toDataUri();
    case "openPeeps":
      return createAvatar(await loadOpenPeeps(), options).toDataUri();
    default:
      return createAvatar(await loadPixelArt(), options).toDataUri();
  }
};

export const resolveUserAvatar = async (avatar?: string) => {
  const normalizedAvatar = normalizeUserAvatar(avatar);
  const cachedSource = avatarSourceCache.get(normalizedAvatar);
  if (cachedSource) return cachedSource;
  const pendingSource = avatarSourcePromiseCache.get(normalizedAvatar);
  if (pendingSource) return pendingSource;

  const definition = avatarDefinitionMap.get(normalizedAvatar);
  if (!definition) return "";
  const sourcePromise = createAvatarSource(definition)
    .then((source) => {
      avatarSourceCache.set(normalizedAvatar, source);
      avatarSourcePromiseCache.delete(normalizedAvatar);
      return source;
    })
    .catch((error) => {
      avatarSourcePromiseCache.delete(normalizedAvatar);
      throw error;
    });
  avatarSourcePromiseCache.set(normalizedAvatar, sourcePromise);
  return sourcePromise;
};
