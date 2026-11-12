package parse

import (
	"strings"
	"testing"
)

func TestParseRejectsExcessiveNesting(t *testing.T) {
	tooDeep := strings.Repeat("(", maxParseDepth+1) + "1" + strings.Repeat(")", maxParseDepth+1)
	_, err := Parse(tooDeep)
	if err == nil {
		t.Fatal("expected nesting depth error")
	}
	if !strings.Contains(err.Error(), "maximum nesting depth") {
		t.Fatalf("unexpected error: %v", err)
	}

	allowed := strings.Repeat("(", 10) + "1" + strings.Repeat(")", 10)
	if _, err := Parse(allowed); err != nil {
		t.Fatalf("expected a shallow expression to parse: %v", err)
	}
}
