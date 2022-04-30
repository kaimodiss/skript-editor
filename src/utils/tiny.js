const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const charLength = characters.length;

module.exports = length => {
	let result = "";
	let i;
	for (i = 0; i < length; i++)
		result += characters.charAt(Math.floor(Math.random() * charLength));
	return result;
};