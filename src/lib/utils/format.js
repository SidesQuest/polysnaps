const SUFFIXES = [
	'', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
	'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg'
];

export function formatNumber(num) {
	if (num < 1000) return Math.floor(num).toString();

	const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
	if (tier >= SUFFIXES.length) return num.toExponential(2);

	const suffix = SUFFIXES[tier];
	const scale = Math.pow(10, tier * 3);
	const scaled = num / scale;

	return scaled.toFixed(scaled < 10 ? 2 : scaled < 100 ? 1 : 0) + suffix;
}

export function formatTime(seconds) {
	if (seconds < 60) return `${Math.floor(seconds)}s`;
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;

	const hours = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	return `${hours}h ${mins}m`;
}
