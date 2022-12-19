import type { GameProps } from "./game_state";

export class Renderer {
    setup?: (props: GameProps) => Promise<void>;
    render?: (props: GameProps, dt: number) => void;
    ready?: boolean;
    mounted?: boolean;
}

export class ListenerManager {
    add?: (state: string, renderer: Renderer) => void;
    remove?: (state: string, renderer: Renderer) => void;
}