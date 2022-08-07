package main

import "testing"

func TestGetChapterLinksPre(t *testing.T) {
	// links, err := getChapterLinksPre("https://earlym.org/manga/martial-peak", "EM")
	// if err != nil {
	// 	t.Errorf("Expected no error, got %v", err)
	// }
	// if len(links) == 0 {
	// 	t.Error("Expected some links, didn't get any")
	// }

	links, err := getChapterLinksPre("https://manhuaplus.com/manga/martial-peak/", "MP")
	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}
	if len(links) == 0 {
		t.Error("Expected some links, didn't get any")
	}
}
