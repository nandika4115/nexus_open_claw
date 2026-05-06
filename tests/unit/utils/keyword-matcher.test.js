import { matchBestThread, scoreKeywordMatch } from "../../../src/utils/keyword-matcher.js";
describe("keyword matcher", () => {
    it("scores keyword matches", () => {
        expect(scoreKeywordMatch({ haystack: "hello world", keywords: ["world"] })).toBe(1);
    });
    it("matches best thread", () => {
        const match = matchBestThread([
            { slug: "a", keywords: ["alpha"] },
            { slug: "b", keywords: ["beta"] }
        ], "beta research");
        expect(match?.slug).toBe("b");
    });
});
