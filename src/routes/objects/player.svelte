<script lang="ts">
	import { add_renderer, GameProps, bumpers, height, state } from './game_state';
	import * as THREE from 'three';
	import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

	export let grid_size: number;

	const model_loc = 'shapes/Snowball.glb';
	const model_scale = 1.0 * grid_size;
	const velocity_scale = 0.0001 * grid_size;
	const radius_scale = 0.0001 * grid_size;
	const bumper_force = 0.05 * grid_size;
	const permitted = ['w', 'a', 's', 'd', ' '];

	const raycaster = new THREE.Raycaster();

	let models: THREE.Group;

	// player properties
	let original_radius: number;
	let radius: number;
	let key_pressed: {
		[key: string]: number[];
	};
	let key_released: {
		[key: string]: number[];
	};
	let velocity_system: {
		unit_vector: THREE.Vector3;
		value: number;
		start: number;
		kill: boolean;
	}[] = [];
	let setup_complete: boolean = false;
	let redirected: boolean = false;

	add_renderer('2', {
		setup(props) {
			return new Promise(async (resolve) => {
				const { scene } = props;

				const loader = new GLTFLoader();

				let loading_promise: Promise<GLTF> = new Promise((resolve) => {
					loader.load(model_loc, (g) => {
						resolve(g);
					});
				});

				let gltf = await loading_promise;

				models = new THREE.Group();
				key_pressed = {
					w: [],
					a: [],
					s: [],
					d: [],
					' ': []
				};
				key_released = {
					w: [],
					a: [],
					s: [],
					d: [],
					' ': []
				};

				let material = new THREE.MeshBasicMaterial({
					color: 0xffffff,
					polygonOffset: true,
					polygonOffsetFactor: 1,
					polygonOffsetUnits: 1
				});
				let model = gltf.scene.children[0] as THREE.Mesh;

				// assumption: model for the most part is spherical. In that case, the radius can be estimated as half of two vertices furthest apart
				let vertices = model.geometry.attributes.position.array;
				let max_dist = 0;
				for (let i = 0; i < vertices.length; i += 3) {
					for (let j = i + 3; j < vertices.length; j += 3) {
						let dist = Math.sqrt(
							Math.pow(vertices[i] - vertices[j], 2) +
								Math.pow(vertices[i + 1] - vertices[j + 1], 2) +
								Math.pow(vertices[i + 2] - vertices[j + 2], 2)
						);
						if (dist > max_dist) {
							max_dist = dist;
						}
					}
				}

				radius = (max_dist / 2) * model_scale;
				original_radius = radius;

				model.material = material;
				model.scale.set(model_scale, model_scale, model_scale);

				models.add(model);

				scene!.add(models);

				setup_complete = true;

				resolve();
			});
		},
		render(props, dt) {
			const { camera, orig_camera_pos_z, items, collected } = props;

			let now = performance.now();
			let has_zero = false;
			let w_time = calculate_influence('w', now);
			let a_time = calculate_influence('a', now);
			let s_time = calculate_influence('s', now);
			let d_time = calculate_influence('d', now);

			let velocity = new THREE.Vector3(
				(d_time - a_time) * velocity_scale * (radius / original_radius),
				(w_time - s_time) * velocity_scale * (radius / original_radius),
				0
			);

			velocity_system.forEach((element) => {
				let decay =
					element.value - (now - element.start) * velocity_scale * (radius / original_radius);

				if (decay < 0) {
					element.kill = true;
					has_zero = true;
				}

				let vel = element.unit_vector.clone().multiplyScalar(decay);

				velocity.add(vel);
			});

			// breaks the rest of the code if distance traveled is empty, as there's no angle to rotate around
			if (velocity.length() === 0) {
				return;
			}

			// if space is pressed, redirect all velocity to one direction, the direction in which the button is being pressed
			if (
				key_pressed[' '].length > 0 &&
				key_pressed[' '].length !== key_released[' '].length &&
				!redirected
			) {
				let unit_vector = new THREE.Vector3(0, 0, 0);

				if (key_pressed['w'].length > 0 && key_pressed['w'].length !== key_released['w'].length) {
					unit_vector.y += 1;
				}
				if (key_pressed['a'].length > 0 && key_pressed['a'].length !== key_released['a'].length) {
					unit_vector.x += -1;
				}
				if (key_pressed['s'].length > 0 && key_pressed['s'].length !== key_released['s'].length) {
					unit_vector.y += -1;
				}
				if (key_pressed['d'].length > 0 && key_pressed['d'].length !== key_released['d'].length) {
					unit_vector.x += 1;
				}

				unit_vector.normalize();

				velocity_system = [];
				velocity_system.push({
					unit_vector: unit_vector,
					value: velocity.length(),
					start: now,
					kill: false
				});

				// condense the key_press/release status
				for (let key of ['w', 'a', 's', 'd']) {
					// the key is still being pressed
					if (key_pressed[key].length > 0 && key_released[key].length < key_pressed[key].length) {
						key_pressed[key] = [now];
						key_released[key] = [];
					}

					// the key is released
					else if (
						key_pressed[key].length > 0 &&
						key_released[key].length === key_pressed[key].length
					) {
						key_pressed[key] = [];
						key_released[key] = [];
					}
				}

				redirected = true;
			}

			if (key_pressed[' '].length === key_released[' '].length) {
				redirected = false;
				key_pressed[' '] = [];
				key_released[' '] = [];
			}

			let prev_pos = models.position.clone();

			let orig_distance = velocity.length();

			let traveled_distance = new THREE.Vector3(0, 0, 0);
			let traveled_displacement = 0;

			// figure out the final position of the player after bumper logic has been applied
			let mat = new THREE.Matrix4();
			let rot_mats = [];
			let reflected = false;

			while (orig_distance > 0) {
				let curr_distance = velocity.length();

				let unit_vector = velocity.clone().normalize();
				let normalized_rot_vector = new THREE.Vector3(-unit_vector.y, unit_vector.x, 0);

				let ray_pos = prev_pos
					.clone()
					.add(traveled_distance)
					.add(new THREE.Vector3(0, 0, grid_size / 2.0));
				raycaster.set(ray_pos, unit_vector);
				raycaster.far = curr_distance;
				raycaster.near = 0;

				let intersects = raycaster.intersectObjects($bumpers);

				if (intersects.length > 0) {
					let intersection = intersects[0];
					let distance_traveled = intersection.distance;

					let new_unit_vector = intersection.face!.normal.clone();
					new_unit_vector.z = 0;

					// make sure the new unit vector is not the same as the old one, otherwise, reverse
					if (unit_vector.equals(new_unit_vector)) {
						new_unit_vector = unit_vector.clone().multiplyScalar(-1);
					}

					let bumper_boost = new_unit_vector.clone().multiplyScalar(bumper_force);

					velocity = new_unit_vector
						.clone()
						.multiplyScalar(velocity.length() - distance_traveled)
						.add(bumper_boost.multiplyScalar(radius / original_radius));

					reflected = true;
				}

				let circumference = 2 * Math.PI * radius;
				let arc = curr_distance % circumference;
				let arc_rad = arc / radius;

				let rotation_matrix = new THREE.Matrix4().makeRotationAxis(normalized_rot_vector, arc_rad);

				rot_mats.unshift(rotation_matrix);

				orig_distance -= velocity.length();
				traveled_distance.add(unit_vector.multiplyScalar(curr_distance));
				traveled_displacement += curr_distance;
			}

			let revert_pos = new THREE.Matrix4().makeTranslation(-prev_pos.x, -prev_pos.y, 0);

			for (let rot of rot_mats) {
				mat.multiply(rot);
			}
			mat.multiply(revert_pos);

			models.applyMatrix4(mat);

			models.position.x = prev_pos.x + traveled_distance.x;
			models.position.y = prev_pos.y + traveled_distance.y;

			let new_radius = radius + traveled_displacement * radius_scale;
			models.scale.set(
				models.scale.x + new_radius / radius - 1,
				models.scale.y + new_radius / radius - 1,
				models.scale.z + new_radius / radius - 1
			);

			radius = new_radius;

			camera!.position.x = models.position.x;
			camera!.position.y = models.position.y;
			camera!.position.z = orig_camera_pos_z! * models.scale.x;

			if (reflected) {
				velocity_system.push({
					unit_vector: velocity.clone().normalize(),
					value: velocity.length(),
					start: now,
					kill: false
				});

				// condense the key_press/release status
				for (let key of ['w', 'a', 's', 'd']) {
					// the key is still being pressed
					if (key_pressed[key].length > 0 && key_released[key].length < key_pressed[key].length) {
						key_pressed[key] = [now];
						key_released[key] = [];
					}

					// the key is released
					else if (
						key_pressed[key].length > 0 &&
						key_released[key].length === key_pressed[key].length
					) {
						key_pressed[key] = [];
						key_released[key] = [];
					}
				}
			}

			// delete 0 velocity vectors from velocity system
			if (has_zero) {
				velocity_system = velocity_system.filter((x) => !x.kill);
			}

			// collect items if distance is less than radius
			for (let [i, item] of items!.entries()) {
				let distance = item.model.position.distanceTo(models.position);
				if (distance < radius && item.model.visible) {
					models.attach(item.model.clone());
					item.model.visible = false;
					collected!.push(item.type);
				}
			}
		}
	});

	function calculate_influence(key: string, now: number) {
		let influence = 0;

		let zipped: [number, number | null][] = key_pressed[key].map((x, i) => [
			x,
			key_released[key][i] ? key_released[key][i] : null
		]);
		let delete_index = [];

		// bugged, check
		for (let [i, [pressed, released]] of zipped.entries()) {
			let positive = now - pressed;
			if (!released) {
				influence += positive;
				continue;
			}

			// if released is not null, then cap at released time rather than using now for positive
			positive = released - pressed;
			let negative = now - released;

			if (negative > positive) {
				delete_index.unshift(i);
				continue;
			}

			influence += positive - negative;
		}

		for (let i of delete_index) {
			key_pressed[key].splice(i, 1);
			key_released[key].splice(i, 1);
		}

		return influence;
	}

	function handle_keydown(event: KeyboardEvent) {
		if ($state !== '2') {
			return;
		}

		if (event.repeat) {
			return;
		}

		if (!permitted.includes(event.key)) {
			return;
		}

		if (!setup_complete) {
			return;
		}

		// failsafe
		if (key_pressed[event.key].length !== key_released[event.key].length) {
			return;
		}

		if (!key_pressed[event.key]) {
			key_pressed[event.key] = [];
		}

		key_pressed[event.key].push(performance.now());
	}

	function handle_keyup(event: KeyboardEvent) {
		if ($state !== '2') {
			return;
		}

		if (!permitted.includes(event.key)) {
			return;
		}

		if (!setup_complete) {
			return;
		}

		if (key_pressed[event.key].length !== key_released[event.key].length + 1) {
			return;
		}

		if (!key_released[event.key]) {
			key_released[event.key] = [];
		}

		key_released[event.key].push(performance.now());
	}
</script>

<svelte:body on:keydown={handle_keydown} on:keyup={handle_keyup} />
