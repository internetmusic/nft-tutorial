#!/usr/bin/env node
import { program } from 'commander';
import * as kleur from 'kleur';
import { TezosOperationError } from '@taquito/taquito';
import { initUserConfig } from './config-util';
import * as networkConf from './config-network';
import * as aliasConf from './config-aliases';
import * as bootstrap from './bootstrap';
import * as contracts from './contracts';
const packageJson = require('../package.json');

// configuration

program.version(packageJson.version);

//prettier-ignore
program
  .command('init-config')
  .alias('ic')
  .description('create tznft.config file')
  .action(initUserConfig);

// selecting network

//prettier-ignore
program
  .command('show-network')
  .alias('shn')
  .description(
    'show currently selected active network', 
    {'a': 'also shows all available networks'}
  )
  .option('-a --all', 'shows all available configured networks', false)
  .action(async options => networkConf.showActiveNetwork(options.all)).passCommandToAction(false);

//prettier-ignore
program
  .command('set-network')
  .alias('setn')
  .arguments('<network>')
  .description('select network to originate contracts on')
  .action(networkConf.setNetwork);

//prettier-ignore
program
  .command('bootstrap')
  .alias('b')
  .description('bootstraps and initialize network provider')
  .action(bootstrap.bootstrap).passCommandToAction(false);

//prettier-ignore
program
  .command('kill-sandbox')
  .alias('k')
  .description('kill running network sandbox. No effect on non-sandbox networks')
  .action(bootstrap.kill);

//aliases

//prettier-ignore
program
    .command('show-alias')
    .alias('sha')
    .description('show details about configured address alias')
    .arguments('[alias]')
    .action(aliasConf.showAlias).passCommandToAction(false);

//prettier-ignore
program
  .command('add-alias')
  .alias('adda')
  .description('add new address alias to the configuration')
  .arguments('<alias> <key_or_address>')
  .action(aliasConf.addAlias).passCommandToAction(false);

//prettier-ignore
program
  .command('add-alias-faucet')
  .alias('addaf')
  .description('add new address alias to the configuration from the faucet json file')
  .arguments('<alias> <faucet_file>')
  .action(aliasConf.addAliasFromFaucet).passCommandToAction(false);

//prettier-ignore
program
  .command('remove-alias')
  .alias('rma')
  .description('remove address alias from the configuration')
  .arguments('<alias>')
  .action(aliasConf.removeAlias).passCommandToAction(false);

// nft

//prettier-ignore
program
  .command('mint')
  .alias('m')
  .description('create a new NFT contract and mint new tokens')
  .arguments('<owner>')
  .requiredOption(
    '-t, --tokens <tokens...>',
    'definitions of new tokens, a list of "id, symbol, name" or "id, symbol, name, ipfc_cid"',
    contracts.parseTokens, [])
  .action(async (owner, options) => contracts.mintNfts(owner, options.tokens)).passCommandToAction(false);

//prettier-ignore
program
  .command('show-balance')
  .alias('shb')
  .description('show NFT balances for the specified owner')
  .requiredOption('-s, --signer <signer>', 'address that originates a query')
  .requiredOption('-n, --nft <nft_address>', 'address of the NFT contract')
  .requiredOption('-o, --owner <owner>', 'token owner to check balances')
  .requiredOption('-t, --tokens <tokens...>', 'list of token IDs to check')
  .action(async options=>contracts.showBalances(
    options.signer, options.nft, options.owner, options.tokens)).passCommandToAction(false);

//prettier-ignore
program
  .command('show-meta')
  .alias('shm')
  .description('show metadata for all tokens in the NFT contract')
  .requiredOption('-s, --signer <signer>', 'address that originates a query')
  .requiredOption('-n, --nft <nft_address>', 'address of the NFT contract')
  .requiredOption('-t, --tokens <tokens...>', 'list of token IDs to check')
  .action(async options=>contracts.showMetadata(
    options.signer, options.nft, options.tokens)).passCommandToAction(false);

//prettier-ignore
program
  .command('transfer')
  .alias('tx')
  .description('transfer NFT tokens')
  .requiredOption('-s, --signer <signer>', 'address that originates a transfer')
  .requiredOption('-n, --nft <nft_address>', 'address of the NFT contract')
  .requiredOption(
    '-b, --batch <batch...>', 
    'definition of individual transfers, a list of "from, to, token_id"',
    contracts.parseTransfers, [])
  .action(async options=>contracts.transfer(
    options.signer, options.nft, options.batch)).passCommandToAction(false);

//prettier-ignore
program
  .command('update-ops')
  .alias('uo')
  .description('update operators for the token owner')
  .arguments('<owner>')
  .requiredOption('-n, --nft <nft_address>', 'address of the NFT contract')
  .option(
    '-a, --add [add_operators...]',
    'list of the "operator, token_id" pairs to be added by the token owner')
  .option(
    '-r, --remove [remove_operators...]',
    'list of the "operator, token_id" pairs to be removed by the token owner')
  .action(async (owner, options) => contracts.updateOperators(
    owner, options.nft, options.add || [], options.remove || [])).passCommandToAction(false);

//debugging command

//prettier-ignore
program
  .command('config-show-all')
  .description('shows whole raw config')
  .action(networkConf.showConfig);

program.parseAsync().catch(error => {
  if (typeof error === 'string') console.log(kleur.red(error));
  else if (error instanceof TezosOperationError) {
    console.log(
      kleur.red(`Tezos operation error: ${kleur.bold(error.message)}`)
    );
  } else {
    console.log(kleur.red('unknown error:'));
    console.log(error);
  }
});
