import { getContext, onMount } from 'svelte';
import { derived, writable, type Readable, type Writable } from 'svelte/store';
import type { ListenerManager, Renderer } from './renderer';

export const width = writable(500);
export const height = writable(500);
export const time = writable(0);
export const orig_camera_pos_z = writable(0);
export const state = writable("1");

export const canvas: Writable<HTMLCanvasElement> = writable();
export const prev_canvas: Writable<THREE.Texture> = writable();
export const scene: Writable<THREE.Scene> = writable();
export const camera: Writable<THREE.PerspectiveCamera> = writable();
export const bumpers: Writable<THREE.Mesh[]> = writable([]);
export const items: Writable<{ model: THREE.Group, type: number }[]> = writable([]);
export const collected: Writable<number[]> = writable([]);

export class GameProps {
    width?: number;
    height?: number;
    time?: number;
    canvas?: HTMLCanvasElement;
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    bumpers?: THREE.Mesh[];
    items?: { model: THREE.Group, type: number }[];
    collected?: number[];
    orig_camera_pos_z?: number;
}

export const props: Readable<GameProps> = derived([
    width, height, time, canvas, scene, camera, bumpers, items, collected, orig_camera_pos_z
], (arr) => {
    return {
        width: arr[0],
        height: arr[1],
        time: arr[2],
        canvas: arr[3],
        scene: arr[4],
        camera: arr[5],
        bumpers: arr[6],
        items: arr[7],
        collected: arr[8],
        orig_camera_pos_z: arr[9]
    }
})

export const key = Symbol();

export function add_renderer(state_num: string, renderer: Renderer | ((props: GameProps, dt: number) => void)) {
    let adder: ListenerManager = getContext(key);

    let val: Renderer = {
        ready: false,
        mounted: false
    };

    if (typeof renderer === 'function') {
        val.render = renderer;
    } else {
        if (renderer.setup) val.setup = renderer.setup;
        if (renderer.render) val.render = renderer.render;
    }

    adder.add!(state_num, val);

    onMount(() => {
        val.mounted = true;
        return () => {
            val.mounted = false;
            adder.remove!(state_num, val);
        }
    })
}