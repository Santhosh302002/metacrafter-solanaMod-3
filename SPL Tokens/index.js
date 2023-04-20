import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, transfer } from '@solana/spl-token';
import {readFileSync, promises as fsPromises} from 'fs';


(async () => {

		// Step 1: Connect to cluster and generate two new Keypairs
        const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

        const contents = await fsPromises.readFile('./secret.json', 'utf-8');
        const secretKey = Uint8Array.from(contents.toString().replace('[', '').replace(']', '').split(','));

        const creatorWallet = Keypair.fromSecretKey(secretKey);
        
        const myWallet = new PublicKey('2jEnRVuDrgCL1mRGNouAXjubnyFPT24TmrepfVsx3S3f');

        // Step 2: Airdrop SOL into your from wallet
        const fromAirdropSignature = await connection.requestAirdrop(creatorWallet.publicKey, LAMPORTS_PER_SOL);
        // Wait for airdrop confirmation
        await connection.confirmTransaction(fromAirdropSignature, { commitment: "confirmed" });

        // Step 3: Create new token mint and get the token account of the creatorWallet address
        //If the token account does not exist, create it
        const mint = await createMint(connection, creatorWallet, creatorWallet.publicKey, creatorWallet.publicKey, 9);
        
        const fromTokenAccount = await 
        getOrCreateAssociatedTokenAccount(
                connection,
                creatorWallet,
                mint,
                creatorWallet.publicKey
        );
        console.log("New Token: " , mint.toBase58());
        
        //Step 4: Mint a new token to the from account
        let signature = await mintTo(
            connection,
            creatorWallet,
            mint,
            fromTokenAccount.address,
            creatorWallet.publicKey,
            1000000000000000,
            []
        );
        console.log('1M ' , mint.toBase58() , ' has been Minted.', '\nTxn Sig: ', signature);
        
        
        //Step 5: Get the token account of the to-wallet address and if it does not exist, create it
        const myWalletTokenAccount = await getOrCreateAssociatedTokenAccount(connection, creatorWallet, mint, myWallet);

        //Step 6: Transfer the new token to the to-wallet's token account that was just created
        // Transfer the new token to the "toTokenAccount" we just created
        signature = await transfer(
            connection,
            creatorWallet,
            fromTokenAccount.address,
            myWalletTokenAccount.address,
            creatorWallet.publicKey,
            1000000000000,
            []
        );
        console.log("Transferred 1000 ", mint.toBase58(), " to address: ", myWallet.toBase58(), '\nSig:', signature);
            
 
})();