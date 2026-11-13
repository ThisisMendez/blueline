# 31. Send contact messages to the support inbox

Status: implemented in 0.2.0, production activation pending

Activate once the Formspree destination is verified and a synthetic message arrives with the fixed subject and expected Reply-To. Contact delivery has its own dependency and can ship independently of signup email.

The live page has an email-app handoff with a disabled button because no address was configured. Add in-page delivery using a $0 option. Prefer a Blue Line address on an existing domain if the owner controls its mail routing and it costs nothing extra. Use the owner's approved Gmail as the private destination otherwise. Keep the destination in server or provider settings.

Accept name, reply email, topic, and message. Use a fixed server-assigned subject, `[Blue Line] Website Contact`, with the topic in the body and the visitor's email as Reply-To. Add no subject field to the form. Avoid attachments. Show a clear delivery error with the message preserved and confirm a successful submission only once the delivery service accepts it. Add validation and spam controls. Verify the message arrives with the exact subject and correct Reply-To. Omit a public response-time promise until one is agreed.

Compare the verified options in [Contact delivery options](../../../research/contact-delivery-options.md). Keep account confirmation email and any future branded replies separate from the contact-form release.

Approved migration plan. Start with Formspree to Gmail for low-volume beta use. Keep the notification recipient and provider in server configuration. After a domain is purchased, verify a Blue Line address as the destination or keep form delivery going straight to Gmail and add the branded address for direct inbound mail. Apps Script is the fallback if Google-only delivery or its higher quota is worth the extra setup. Choose a separate sending setup if replies must come from the branded address.
