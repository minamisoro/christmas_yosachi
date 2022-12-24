<script lang="ts">
	import { add_renderer, state as globalState } from './game_state';
	import * as THREE from 'three';
	import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

	export let color1: string;
	export let color2: string;

	let bg: THREE.Mesh;
	let loading: THREE.Mesh;
	let curr_width: number;
	let curr_height: number;

	let state = 0;
	let local_dt = 0;
	let finished_rendering = false;

	add_renderer('1', {
		setup(props) {
			return new Promise((resolve) => {
				const { scene, width, height } = props;

				const bg_geo = new THREE.PlaneGeometry(width, height);
				const bg_mat = new THREE.MeshBasicMaterial({ color: color2 });
				const b = new THREE.Mesh(bg_geo, bg_mat);
				b.position.set(0, 0, 0);
				curr_width = width!;
				curr_height = height!;

				const load_geo = new THREE.PlaneGeometry(width! * 0.6, height! * 0.8);
				const load_mat = new THREE.MeshBasicMaterial({
					color: color1,
					transparent: true,
					opacity: 0.0
				});
				const l = new THREE.Mesh(load_geo, load_mat);
				l.position.set(0, -height! * 0.8, 1);

				bg = b;
				loading = l;

				const exp = document.createElement('div');
				exp.textContent =
					'クリームの球体を転がしていちごを出来るだけ集めよう！\r\n\r\nただし途中で落ちているエビフライを巻き込むと減点される、\r\n上手く避けよう';
				exp.style.color = 'white';
				exp.style.fontSize = '28px';
				exp.style.fontWeight = 'bold';
				exp.style.whiteSpace = 'pre-line';
				exp.className = 'tutorial';
				const exp_text = new CSS2DObject(exp);
				exp_text.position.set(0, height! * 0.2, 2);
				l.add(exp_text);

				const header_bg_geo = new THREE.PlaneGeometry(width! * 0.4, height! * 0.04);
				const header_bg_mat = new THREE.MeshBasicMaterial({ color: 'black' });
				const header_bg = new THREE.Mesh(header_bg_geo, header_bg_mat);

				const control_header = document.createElement('div');
				control_header.textContent = '操作方法';
				control_header.style.color = 'white';
				control_header.style.fontSize = '28px';
				control_header.style.fontWeight = 'bold';
				control_header.className = 'tutorial';
				const control_header_text = new CSS2DObject(control_header);
				header_bg.add(control_header_text);
				header_bg.position.set(0, height! * 0.07, 2);
				l.add(header_bg);

				// draw wasd
				const button_background_geo = new THREE.PlaneGeometry(height! * 0.05, height! * 0.05);
				const button_background_mat = new THREE.MeshBasicMaterial({ color: 'white' });
				const button_bg = new THREE.Mesh(button_background_geo, button_background_mat);
				const w_button_text = document.createElement('div');
				w_button_text.textContent = 'W';
				w_button_text.style.color = 'black';
				w_button_text.style.fontSize = '15px';
				w_button_text.style.fontWeight = 'bold';
				w_button_text.className = 'tutorial';
				const w_text = new CSS2DObject(w_button_text);
				const w_button = button_bg.clone();
				w_button.add(w_text);
				w_button.position.set(-width! * 0.25 + width! * 0.1, 0, 2);
				l.add(w_button);

				const a_button_text = document.createElement('div');
				a_button_text.textContent = 'A';
				a_button_text.style.color = 'black';
				a_button_text.style.fontSize = '15px';
				a_button_text.style.fontWeight = 'bold';
				a_button_text.className = 'tutorial';
				const a_text = new CSS2DObject(a_button_text);
				const a_button = button_bg.clone();
				a_button.add(a_text);
				a_button.position.set(-width! * 0.22 + width! * 0.1, 0, 2);
				l.add(a_button);

				const s_button_text = document.createElement('div');
				s_button_text.textContent = 'S';
				s_button_text.style.color = 'black';
				s_button_text.style.fontSize = '15px';
				s_button_text.style.fontWeight = 'bold';
				s_button_text.className = 'tutorial';
				const s_text = new CSS2DObject(s_button_text);
				const s_button = button_bg.clone();
				s_button.add(s_text);
				s_button.position.set(-width! * 0.19 + width! * 0.1, 0, 2);
				l.add(s_button);

				const d_button_text = document.createElement('div');
				d_button_text.textContent = 'D';
				d_button_text.style.color = 'black';
				d_button_text.style.fontSize = '15px';
				d_button_text.style.fontWeight = 'bold';
				d_button_text.className = 'tutorial';
				const d_text = new CSS2DObject(d_button_text);
				const d_button = button_bg.clone();
				d_button.add(d_text);
				d_button.position.set(-width! * 0.16 + width! * 0.1, 0, 2);
				l.add(d_button);

				const move_text = document.createElement('div');
				move_text.textContent = '移動';
				move_text.style.color = 'white';
				move_text.style.fontSize = '20px';
				move_text.style.fontWeight = 'bold';
				move_text.className = 'tutorial';
				const move_text_obj = new CSS2DObject(move_text);
				move_text_obj.position.set(width! * 0.1, 0, 2);
				l.add(move_text_obj);

				// draw space
				const space_button_geo = new THREE.PlaneGeometry(
					height! * 0.05 * 2 + width! * 0.045,
					height! * 0.05
				);
				const space_button_mat = new THREE.MeshBasicMaterial({ color: 'white' });
				const space_button = new THREE.Mesh(space_button_geo, space_button_mat);

				const space_button_text = document.createElement('div');
				space_button_text.textContent = 'Space';
				space_button_text.style.color = 'black';
				space_button_text.style.fontSize = '15px';
				space_button_text.style.fontWeight = 'bold';
				space_button_text.className = 'tutorial';
				const space_text = new CSS2DObject(space_button_text);
				space_button.add(space_text);
				space_button.position.set(
					-width! * 0.25 + width! * 0.09 * 0.5 + width! * 0.1,
					-width! * 0.03,
					2
				);
				l.add(space_button);

				const redirect_text = document.createElement('div');
				redirect_text.textContent = '方向転換';
				redirect_text.style.color = 'white';
				redirect_text.style.fontSize = '20px';
				redirect_text.style.fontWeight = 'bold';
				redirect_text.className = 'tutorial';
				const redirect_text_obj = new CSS2DObject(redirect_text);
				redirect_text_obj.position.set(width! * 0.1, -width! * 0.03, 2);
				l.add(redirect_text_obj);

				// add button to move to next scene
				const next_state_button_geo = new THREE.PlaneGeometry(
					height! * 0.05 * 2 + width! * 0.045,
					height! * 0.05
				);
				const next_state_button_mat = new THREE.MeshBasicMaterial({ color: 'black' });
				const next_state_button = new THREE.Mesh(next_state_button_geo, next_state_button_mat);

				const next_state_button_text = document.createElement('div');
				next_state_button_text.textContent = 'START';
				next_state_button_text.style.color = 'white';
				next_state_button_text.style.fontSize = '20px';
				next_state_button_text.style.fontWeight = 'bold';
				next_state_button_text.className = 'tutorial';
				const next_state_button_obj = new CSS2DObject(next_state_button_text);
				next_state_button.add(next_state_button_obj);
				next_state_button.position.set(0, -height! * 0.3, 2);
				next_state_button_obj.element.addEventListener('click', () => {
					// hide every div with class tutorial
					const tutorial_divs = document.getElementsByClassName('tutorial');
					for (let i = 0; i < tutorial_divs.length; i++) {
						(tutorial_divs[i] as HTMLElement).style.display = 'none';
					}
					globalState.set('2');
				});
				l.add(next_state_button);

				scene!.add(b);
				scene!.add(l);

				resolve();
			});
		},
		render(props, dt) {
			const { width, height, camera, collected } = props;

			switch (state) {
				case 0:
					// fade in from below
					local_dt += dt;

					let t = local_dt / 300.0;
					// transform t so that it eases in at exponential rate
					let new_t = Math.pow(t, 2) * 0.8 + 0.2;

					if (t > 1.0) {
						t = 1.0;
						new_t = 1.0;
						local_dt = 0;
						state = 1;
						finished_rendering = true;
					}

					let opacity = new_t * 0.4 + 0.2;
					let y = -height! * 0.8 * (1.0 - new_t);
					(loading.material as THREE.MeshBasicMaterial).opacity = opacity;
					loading.position.y = y;
					break;
			}
		}
	});
</script>
