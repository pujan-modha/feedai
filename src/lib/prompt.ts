export function current_prompt(
  curr_lang: string,
  curr_categories: Array<string>,
  user_prompt: string,
  images_arr: Array<string>,
  links_arr: Array<string>
) {
  return `You are tasked with processing and rewriting a news article to make it SEO-friendly, plagiarism-free, and compliant with Google News standards. The output must be in ${curr_lang} language. Follow these steps to generate the output:
Content Transformation:
${user_prompt}
Input Parameters:
A list of pre-defined categories for the website. Make sure that categories must be taken from the list below:
${curr_categories}
Instruction for Handling Images and Embeds:
    The input contains placeholders for images and embeds such as [IMAGE], [IFRAME]. Ensure that:
    You must replace placeholders like [IMAGE] and [IFRAME] with html tags with src ${images_arr.join(
      " ,"
    )} and ${links_arr.join(" ,")}
    respectively, do not keep placeholders in the output.
    The count of Images and Embeds in the output matches exactly the count of [IMAGE] and [IFRAME] in the input.
    No extra images or embeds are added or removed.
    Images and Embeds are placed in appropriate paragraphs to maintain logical flow, but the overall count remains consistent with the input.
    Do not inculde [IMAGE] and [IFRAME] placeholders in the output.
    Must include all images and embeds in the output in the same order as they appeared in the input.
    The input also contains placeholders for blockquotes such as [BLOCKQUOTE]. Ensure that:
    Keep [BLOCKQUOTE] placeholders in the output.
    The count of Blockquotes in the output matches exactly the count of [BLOCKQUOTE] in the input.
    No extra blockquotes are added or removed.
    Blockquotes are placed in appropriate paragraphs to maintain logical flow, but the overall count remains consistent with the input.
    You must inculde [BLOCKQUOTE] placeholders in the output.
    Must include all blockquotes in the output in the same order as they appeared in the input.
Output Format (Do not use backticks anywhere in the json and do not give response in markdown just give plain text):
{
  "rewritten_article": {
    "title": "SEO-Friendly Article Title Here",
    "content": [
      {
        "heading": "Main Heading for Section",
        "paragraphs": [
          "Paragraph 1 of this section in ${curr_lang} language goes here must including if any image html tags and/or embed html tags (${images_arr.join(
    " ,"
  )} and ${links_arr.join(
    " ,"
  )}) without [IAMGE] and [IFRAME] placeholders but including [BLOCKQUOTE] placeholders.",
        ]
      }
    ]
  },
  "seo_title": "SEO-Friendly Title Here",
  "meta_title": "Meta Title for SEO",
  "meta_description": "Short meta description for SEO. Typically under 160 characters.",
  "meta_keywords": ["keyword1", "keyword2", "keyword3", "etc."],
  "summary": "Short 160-word summary providing an overview of the article and generating curiosity.",
  "categories": {
    "primary_category": "Main Category",
    "secondary_category": "Secondary Category"
  }
}
    `;
}
