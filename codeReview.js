import { Router, Request, Response } from 'api-framework'; // express-like package
 
   import { getDBConnection } from '../config/db';
   import { User } from '../types/user';
   import { sendEmail } from '../util/send_email';
   import { sendText } from '../util/send_text';
 
   const router = Router();
   const db = getDBConnection();
 
   const fetchUsersByEmail = async (emails: string[]) => {
     const users: User[] = await db<User>('users')
       .select('id', 'email', 'first_name', 'enabled_features')
       .whereIn('email', emails);
 
     if (!users) {
       throw new Error('No users found');
     }
 
     return users;
   };
 
   router.patch('/features', async (req: Request, res: Response) => {
     const { emails, feature } = req.body; // these should be a list of emails and a feature, respectively
 
     const users = fetchUsersByEmail(emails);
 
     const fetchedEmails = users.map((u) => u.email);
     emails.forEach((email: string) => {
       if (!fetchedEmails.find((e) => e === email)) {
         return res.status(200).send({
           message: `User with email ${email} doesn't exist`,
         });
       }
     });
 
     let onboardedCount = 0;
     for (const user of users) {
       if (!user.enabled_features[feature]) {
         console.log(`Enabling feature ${feature} for user ${user.id}...`);
         const now_timestamp_string = new Date().toISOString();
         await db.raw(`
           UPDATE users
           SET
             enabled_features = jsonb_set(enabled_features, '{${feature}}', to_jsonb(now())),
             updated_at = ${now_timestamp_string}
         `);
         await sendEmail({
           to: user.email,
           from: {
             email: 'support@withyotta.com',
             name: 'Yotta',
           },
           subject: 'New Feature Available!',
           paragraphs: [
             // generic email
             `Feature ${feature} is now available to you! Check it out in your app.`
           ],
         });
         await sendText({
           to: user.phone_number,
           from: {
             phoneNumber: '+12345678910',
             name: 'Yotta',
           },
           message: [
             // generic text
             `Feature ${feature} is now available to you! Check it out in your app.`
           ],
         });
         onboardedCount += 1;
       }
     }
 
     return res.status(200).send({ onboarded: onboardedCount });
   });
 
   export default router;
