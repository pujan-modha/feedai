export function current_prompt(
  curr_lang: string,
  curr_categories: Array<string>,
  user_prompt: string,
  images_arr: Array<string>,
  links_arr: Array<string>
) {
  console.log("Lmao", curr_categories);
  return `You are tasked with processing and rewriting a news article to make it SEO-friendly, plagiarism-free, and compliant with Google News standards. The output must be in ${curr_lang} language. Follow these steps to generate the output:
Content Transformation:
${user_prompt}
Use only the categories provided below, exactly as structured:
${JSON.stringify(curr_categories, null, 2)}.
Categories are structured as "Secondary Category (ID: ID)": ["Primary Category 1 (ID: ID)", "Primary Category 2 (ID: ID)"]. Strictly adhere to the following rules:

1. **Category Matching**:
   - Select categories directly from the input structure provided above. Only use categories and IDs from this structure.
   - Secondary categories must match the keys exactly, including casing, spacing, and format.
   - Primary categories must match the values exactly, including casing, spacing, and format.

2. **Category Selection Rules**:
   - If a secondary category is selected, it must have been explicitly provided in the input.
   - Primary categories chosen must belong to the list under the selected secondary category in the input.

2.5 **Handling Categories when article do not match any input category**:
   - If an article does not match any input category, you must select the closest matching category from the list of categories provided in the input.

3. **ID Validation**:
   - Ensure that both "primary_category_id" and "secondary_category_id" are integer IDs directly extracted from the input.
   - Do not invent or modify any IDs.
4. **Instruction for Handling Images and Embeds**:
   - Replace placeholders like [IMAGE] and [IFRAME] with corresponding HTML tags using the URLs provided in ${images_arr.join(
     " ,"
   )} and ${links_arr.join(
    " ,"
  )}, ensuring no placeholders remain in the output.
   - Maintain the exact count of images and embeds as in the input.
   - Include images and embeds in the logical flow of the article, in the same order as their placeholders appeared.
   - Blockquotes ([BLOCKQUOTE]) must be preserved in the output only if present in the input. Do not add or remove blockquotes beyond what is provided.

**Output Format (strictly adhere to this format, do not use backticks or markdown in the response)**:
{
  "rewritten_article": {
    "title": "SEO-Friendly Article Title Here",
    "content": [
      {
        "heading": "Main Heading for Section",
        "paragraphs": [
          "Paragraph 1 of this section in ${curr_lang} language goes here, including any image HTML tags and/or embed HTML tags (${images_arr.join(
    " ,"
  )} and ${links_arr.join(
    " ,"
  )}). Do not include [IMAGE] or [IFRAME] placeholders but preserve [BLOCKQUOTE] placeholders."
        ]
      }
    ]
  },
  "seo_title": "SEO-Friendly Title Here",
  "meta_title": "Meta Title for SEO",
  "meta_description": "Short meta description for SEO, typically under 160 characters.",
  "meta_keywords": ["keyword1", "keyword2", "keyword3", "etc."],
  "summary": "Short summary of about 160 words that provides an overview of the article and generates curiosity.",
  "categories": {
    "primary_category": "Primary Category from the pre-defined list",
    "secondary_category": "Secondary Category from the pre-defined list"
  },
  "primary_category_id": Primary Category ID from the pre-defined list (integer format),
  "secondary_category_id": Secondary Category ID from the pre-defined list (integer format)
}

**Example of Valid Outputs Based on Input:**
   - Input: {'Entertainment (ID: 18)': ['Movies (ID: 20)', 'Music (ID: 21)']}
     Valid Output: {
       "categories": {
         "primary_category": "Movies",
         "secondary_category": "Entertainment"
       },
       "primary_category_id": 20,
       "secondary_category_id": 18
     }
    `;
}
