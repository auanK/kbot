const DICE_REGEX = /^(\d+)?d(\d+)$/i;

const PRINT_LIMIT = 10;
const MAX_SETS = 20;
const MAX_DICE = 100;
const MAX_SIDES = 1000;

export default {
  name: 'roll',

  async run({ sock, msg, args }) {
    const jid = msg.key.remoteJid;
    let numSets = 1;
    let diceNotation = '';

    if (args.length === 0) {
      return sock.sendMessage(
        jid,
        { text: 'Uso: !roll [XdY] ou !roll [sets] [XdY]' },
        { quoted: msg }
      );
    }

    if (args.length === 1) {
      diceNotation = args[0];
    } else if (args.length === 2) {
      numSets = parseInt(args[0], 10);
      diceNotation = args[1];
    }

    const match = diceNotation.match(DICE_REGEX);

    if (!match) {
      return sock.sendMessage(
        jid,
        { text: `Formato inválido. Use XdY (ex: d20, 3d6).` },
        { quoted: msg }
      );
    }

    const numDice = parseInt(match[1] || '1', 10);
    const numSides = parseInt(match[2], 10);

    if (isNaN(numSets) || numSets < 1 || numSets > MAX_SETS) {
      return sock.sendMessage(jid, { text: `Máximo de rolagens: ${MAX_SETS}.` }, { quoted: msg });
    }
    if (numDice < 1 || numDice > MAX_DICE) {
      return sock.sendMessage(jid, { text: `Máximo de dados: ${MAX_DICE}.` }, { quoted: msg });
    }
    if (numSides < 1 || numSides > MAX_SIDES) {
      return sock.sendMessage(jid, { text: `Máximo de faces: ${MAX_SIDES}.` }, { quoted: msg });
    }

    if (numSets === 1 && numDice === 1) {
      const roll = Math.floor(Math.random() * numSides) + 1;
      const reply = `🎲 *${roll}*`;

      await sock.sendMessage(jid, { text: reply }, { quoted: msg });
      return;
    }

    let reply = '🎲';

    for (let i = 0; i < numSets; i++) {
      let rolls = [];
      let total = 0;

      for (let j = 0; j < numDice; j++) {
        const roll = Math.floor(Math.random() * numSides) + 1;
        rolls.push(roll);
        total += roll;
      }

      const prefix = i === 0 ? ' ' : '\n';

      if (numDice === 1) {
        reply += `${prefix}*${total}*`;
      } else {
        let rollsStr = '';
        if (rolls.length > PRINT_LIMIT) {
          const first = rolls.slice(0, PRINT_LIMIT - 1);
          const last = rolls[rolls.length - 1];
          rollsStr = `${first.join(', ')}, ..., ${last}`;
        } else {
          rollsStr = rolls.join(', ');
        }

        reply += `${prefix}[${rollsStr}] = *${total}*`;
      }
    }

    await sock.sendMessage(jid, { text: reply }, { quoted: msg });
  },
};
