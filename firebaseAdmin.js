import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      // Your Firebase service account configuration
      type: "service_account",
      project_id: "zappyapp",
      private_key_id: "d49af649383e68e082503cf9d77353d35f30ef9a",
      private_key:
        "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCjloQa66X1RVDi\nB5qdEkysbvpgYtqvvAQ2PJBw+8u3z6Y8Aim5GBFk5ob65L3+Ngt+hzYKqRnCGxZn\nnCgqM31H1dXK5PO3AMlcnFUayoYFsunNAYr2bQcWOBbYA7BVIN5UikJ9mH4A4/od\nf/1j7H+VT3mYWb/B7XqsjQiTCX+gU8ISTs5BC9x9lzefYzahEjvAXJWfGg7sn8lu\nfWlqP2YyClj0gpAZ499OIu3cpHnyEI7lEXpLf+Byss0Fd+6JierXWXpgO5F7e42Z\n3DdReqd4sZjee1Ds9AA2UUh9gubrD6EnhWDXrysDaTvtqZizZJflImKFRS58MGb2\nUwGv1/cDAgMBAAECggEAUSihjcGPamnjQOBI4thrVbkRWrRwjnMXG9lcR9GENkM8\n09S24m+AYbDFEsBdSjuB5Fosg4l1kAlkSi789kLpSrRaBvkjuI0ZWWruBgaoCzfC\nKsUzLiLVOz7EhpL97p4J76NQbYM0MDjqo6wWCHcSrP7q8pzEN/AbxnOJ53j06pMX\n2xoDW1JnbWKCw5OSs0CUjgLq/DtupFa/KnWcwgTTmAUhEJ3K/rz5To1x3ZJkdnTr\nOsM6sY+zVXU8mri9eSbCMSS0G7PBRu2KtSx3XnpTQZnva1PrWmOpBhxH8wCkJ3/k\nnAQ4QDrPaRM74RkibETppmZ7tlEiFLeCdh4EWN81UQKBgQDap14ZNuDsh8+KqIJs\nEOEADq0l+Ilj3FwOJFCsBq0Obxfa+ZBhpcj/6Bk8Mc8ssBmsgNhV9Q78Uy2az9FH\ncN9N5KLvss9m4NaR0yJfvB3eGrJJ+vJ63khFFyRzofwkVxM5XPDuX1HALqaeGwHx\n4VUDLPDQXYO667rl1Cja7wySzwKBgQC/h2VvwgQ9rGo3NQdyuDodtP8Pqco7i21a\n4HFfJUuYJQOl2pQ8z4hck2IsaFziO+QRrrQFQzHpW5dB7OujmfKxS0iB0wsYBGUx\n7L7wnSTW4PTL/UEyiZGUZsxZR7xOhWdf1vtmOy3hN+oWPPCIZuQ+4z68DUtANtyH\nNvp/QqX1jQKBgQDL+HV/cAJCpC6nWqrPxK8gLpC3azI/RcFaL+ZRk6i8XkYSr9xQ\nOydWEl34GT76oQxSL5+gEAr6t11DnbnMuy6Uq0ST9mojvnprbloSlJoIJz9KZB7v\nH4yrZvtKI0HjZJc6W8kllSXd8abctrUJvvpfC/1ZYuMP6/ddjpzOH1HLYQKBgFvv\nP++PL73y3uE1ISgd6jeMQ8pe8+X1HT678W98VXbofYHFE9bEv23AiSVLyxoFKYqb\nU2obQQAEqOxKLynOocIcouc+SFr08SYvv897fs1uGdM482ywwCJ93aUVW/xM6LwG\nU5JU4cbzsfeOtN6klPbi2aAmuXJPYze8Wi1v7n2ZAoGAJnoQhzV9IF5lbv7b7mh9\nMD0ch40+/tzs04PdSZd1fAMYdItNnW19VYzSL2lFTDtz9mJvaZ8oUNLj3cVwx1nz\nHxOHbq/fsuTHBquvIMpB3AzPlfY+G2zW7nIJhrwuTwvB68zP/gIT14i1LkPRzr1a\n+pK/oTAdBbDXqNlhwhrJawE=\n-----END PRIVATE KEY-----\n",
      client_email: "firebase-adminsdk-a9c5b@zappyapp.iam.gserviceaccount.com",
      client_id: "101415293715971692651",
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url:
        "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-a9c5b%40zappyapp.iam.gserviceaccount.com",
      universe_domain: "googleapis.com",
    }),
    databaseURL: "https://zappyapp.firebaseio.com",
  });
}

export default admin;
