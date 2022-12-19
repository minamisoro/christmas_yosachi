<script lang="ts">
	import { onMount } from 'svelte';

	import Canvas from './objects/canvas.svelte';
	import Background from './objects/background.svelte';
	import Floor from './objects/floor.svelte';
	import Bumper from './objects/bumper.svelte';
	import Player from './objects/player.svelte';
	import Item from './objects/item.svelte';
	import Timer from './objects/timer.svelte';

	const grid_size = 50;
	const width = 250;
	const height = 250;
</script>

<Canvas>
	<!-- State #1, explanation/loading -->
	<!-- State #2, gameplay -->
	<Player {grid_size} />
	<Bumper color={'#00ff00'} {grid_size} {width} {height} bumper_percentage={0.8} />
	<Floor color={'#eef6f7'} {grid_size} {width} {height} />
	<Item {grid_size} {width} {height} />
	<Timer />
	<!-- State #3, scoreboard -->
	<Background color={'#222222'} />
</Canvas>
