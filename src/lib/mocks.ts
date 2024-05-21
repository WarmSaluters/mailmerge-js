import { Email } from "./types.js";

const mockResponse = `{
    "emails": [
        {
            "to": "tim.ray@chemeketa.edu",
            "subject": "Inquiry Regarding Your Role at Chemeketa Community College",
            "body": "Hi Tim,\\n\\nI found your email from the Chemeketa Community College website and I thought it would be interesting to reach out to you regarding your role as Dean of Agriculture Science and Technology. I'm a startup founder looking to build software in higher ed and I was wondering if you'd be able to help me answer a few questions:\\n\\n- What are the biggest challenges you face in your current position?\\n- How is technology currently utilized in your department?\\n\\nWould you be able to jump on a call sometime next week?\\n\\nThanks,\\nCharles\\n[LinkedIn](https://linkedin.com/in/charlesyu108)"
        },
        {
            "to": "schills@linnbenton.edu",
            "subject": "Inquiry Regarding Your Role at Linn-Benton Community College",
            "body": "Hi Steve,\\n\\nI found your email from the Linn-Benton Community College website and I thought it would be interesting to reach out to you regarding your role as Dean: Advanced Manufacturing & Transportation Technology. I'm a startup founder looking to build software in higher ed and I was wondering if you'd be able to help me answer a few questions:\\n\\n- What are the current goals for your department?\\n- What software solutions are currently in use and how effective are they?\\n\\nWould you be able to jump on a call sometime next week?\\n\\nThanks,\\nCharles\\n[LinkedIn](https://linkedin.com/in/charlesyu108)"
        }
    ],
    "warnings": ["This is a mock response"]
}
`;

export const getMockEmails = (): { emails: Email[]; warnings: string[] } => {
  const responseJSON = JSON.parse(mockResponse);
  return {
    emails: responseJSON.emails ?? [],
    warnings: responseJSON.warnings ?? [],
  };
};
