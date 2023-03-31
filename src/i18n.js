const dict = {
  en: {
    swap: "Swap",
    refund: "Refund",
    documentation: "Docs",
    onion: "Onion",
    channels: "Channels",
    ordinals: "Ordinals",
    mempool: "View on mempool.space",
    help: "Help",
    network_fee: "Network Fee",
    fee: "Boltz Fee",
    denomination: "Denomination",
    min: "Mininum",
    max: "Maximum",
    assets: "Assets",
    socialmedia: "Follow us on Social Media",
    footer: "made with ❤️ in El Salvador",
    create_swap: "Create Atomic Swap",
    create_swap_subline: "Payment includes network and boltz service fees",
    cancel_swap: "Cancel Swap",
    new_swap: "New Swap",
    success_swap: "Swap Success",
    create_and_paste: "Amount: {{ amount }} {{ denomination }}\nPaste a bolt11 lightning invoice\n or a Lightning address\nor a LNURL Paylink",
    congrats: "Congratulations!",
    successfully_swapped: "You have successfully swapped {{ amount }} {{ denomination }}.",
    pay_invoice: "Swap: {{ id }}",
    pay_swap_404: "Swap not found!",
    pay_timeout_blockheight: "Timeout blockheight",
    pay_expected_amount: "Expected amount",
    pay_address: "Address",
    lockup_failed: "Lockup Failed!",
    lockup_failed_subline: "Your Onchain lockup failed, wait for the timeout to refund your bitcoin",
    lockup_failed_reason: "Failure reason",
    download_refund_json: "Download refund JSON",
    download_refund_qr: "Download refund QRCode",
    copy_invoice: "Copy lightning invoice",
    copy_onchain: "Copy onchain address",
    copy_amount: "Copy amount",
    copy_bip21: "Copy BIP21",
    copied: "Copied to clipboard!",
    refund_a_swap: "Refund a swap",
    refund_a_swap_subline: "Upload your refund.json file and reclaim you on-chain funds",
    refund_past_swaps: "Past swaps",
    refund_past_swaps_subline: "those swap got saved into your browsers localstorage",
    refund_address_placeholder: "Refund onchain address",
    refund_clear: "Delete localstorage",
    delete_swap: "Delete swap from localstorage",
    delete_localstorage: "Are you sure you want to clear your localstorage?\nYour swap information and you refund / claim privatekeys will be lost.",
    tx_in_mempool: "Transaction is in mempool",
    tx_in_mempool_subline: "waiting for confirmation to complete the swap",
    expired: "Swap expired!",
    swap_expired: "You did not complete your payment in time. Try again.",
    create_invoice_webln: "create invoice via WebLN",
    pay_invoice_webln: "pay invoice via WebLN",
    select_asset: "Select Asset",
  },
  de: {
    swap: "Tausch",
    refund: "Rückerstattung",
    documentation: "Dokumentation",
    onion: "Zwiebel",
    footer: "mit ❤️ gemacht in El Salvador",
    network_fee: "Netzwerk Gebühren",
    help: "Hilfe",
  },
};

export default dict;
