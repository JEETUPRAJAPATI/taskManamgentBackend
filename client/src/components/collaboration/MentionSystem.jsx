import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { AtSign, Bell, X } from "lucide-react";

export function MentionSystem({ 
  value = "", 
  onChange, 
  users = [], 
  currentUser,
  placeholder = "Type @ to mention someone...",
  className = "",
  onMention = () => {}
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  
  const textareaRef = useRef(null);
  const suggestionsRef = useRef(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create mention notification (demo mode)
  const createMentionMutation = {
    mutate: (mentionData) => {
      toast({
        title: "Mention created",
        description: `You mentioned ${mentionData.mentionedUserId}`
      });
    }
  };

  // Handle input changes and detect mentions
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(cursorPos);
    
    // Find the last @ symbol before cursor
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Check if @ is at start or preceded by whitespace
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      if (charBeforeAt === ' ' || lastAtIndex === 0) {
        const query = textBeforeCursor.substring(lastAtIndex + 1);
        
        // Check if query contains whitespace (mention is complete)
        if (!query.includes(' ')) {
          setMentionQuery(query);
          setShowSuggestions(true);
          setSuggestionIndex(0);
        } else {
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;
    
    const filteredUsers = getFilteredUsers();
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSuggestionIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        if (filteredUsers.length > 0) {
          e.preventDefault();
          insertMention(filteredUsers[suggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Insert mention into text
  const insertMention = (user) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    const beforeMention = value.substring(0, lastAtIndex);
    const mentionText = `@${user.firstName} ${user.lastName}`;
    const afterMention = textAfterCursor;
    
    const newValue = `${beforeMention}${mentionText} ${afterMention}`;
    const newCursorPos = lastAtIndex + mentionText.length + 1;
    
    onChange(newValue);
    setShowSuggestions(false);
    
    // Create mention notification
    createMentionMutation.mutate({
      mentionedUserId: user._id,
      mentionedBy: currentUser._id,
      content: newValue,
      type: 'comment'
    });
    
    onMention(user);
    
    // Focus back to textarea and set cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Get filtered users based on query
  const getFilteredUsers = () => {
    return users
      .filter(user => user._id !== currentUser._id)
      .filter(user => {
        if (!mentionQuery) return true;
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const email = user.email.toLowerCase();
        const query = mentionQuery.toLowerCase();
        return fullName.includes(query) || email.includes(query);
      })
      .slice(0, 8); // Limit to 8 suggestions
  };

  // Scroll suggestion into view
  useEffect(() => {
    if (suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[suggestionIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [suggestionIndex]);

  // Extract mentions from text for rendering
  const extractMentions = (text) => {
    const mentionRegex = /@([A-Za-z]+\s+[A-Za-z]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index),
          key: `text-${lastIndex}`
        });
      }

      // Add mention
      const mentionName = match[1];
      const user = users.find(u => 
        `${u.firstName} ${u.lastName}` === mentionName
      );

      parts.push({
        type: 'mention',
        content: match[0],
        user: user,
        key: `mention-${match.index}`
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex),
        key: `text-${lastIndex}`
      });
    }

    return parts;
  };

  const filteredUsers = getFilteredUsers();

  return (
    <div className={`relative ${className}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full min-h-[100px] p-3 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        rows={4}
      />

      {/* Mention Suggestions */}
      {showSuggestions && filteredUsers.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border-border shadow-lg">
          <CardContent className="p-0">
            <div className="p-2 border-b border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AtSign className="h-4 w-4" />
                Select team member to mention
              </div>
            </div>
            <ScrollArea className="max-h-48">
              <div ref={suggestionsRef} className="p-1">
                {filteredUsers.map((user, index) => (
                  <div
                    key={user._id}
                    className={`flex items-center gap-3 p-2 cursor-pointer rounded transition-colors ${
                      index === suggestionIndex 
                        ? 'bg-accent text-accent-foreground' 
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => insertMention(user)}
                    onMouseEnter={() => setSuggestionIndex(index)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </div>
                    </div>
                    {user.role && (
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Mention Preview (for display purposes) */}
      {value && (
        <div className="mt-2 p-2 bg-muted/50 rounded border border-border">
          <div className="text-xs text-muted-foreground mb-1">Preview:</div>
          <div className="text-sm">
            {extractMentions(value).map((part) => (
              part.type === 'mention' ? (
                <Badge 
                  key={part.key}
                  variant="secondary" 
                  className="mx-1 text-xs bg-primary/20 text-primary border-primary/30"
                >
                  <AtSign className="h-3 w-3 mr-1" />
                  {part.user ? `${part.user.firstName} ${part.user.lastName}` : part.content}
                </Badge>
              ) : (
                <span key={part.key}>{part.content}</span>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Mention notifications component
export function MentionNotifications({ userId, onMentionClick = () => {} }) {
  // Generate demo mentions
  const mentions = [
    {
      _id: "mention_1",
      mentionedBy: {
        firstName: "Sarah",
        lastName: "Chen",
        email: "sarah.chen@company.com"
      },
      content: "Can you review the latest design mockups for @John Smith?",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      unread: true
    },
    {
      _id: "mention_2", 
      mentionedBy: {
        firstName: "Mike",
        lastName: "Johnson",
        email: "mike.johnson@company.com"
      },
      content: "Thanks for the feedback @John Smith! I'll implement those changes.",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      unread: true
    }
  ];

  const isLoading = false;

  const markAsReadMutation = {
    mutate: (mentionId) => {
      console.log("Marking mention as read:", mentionId);
    }
  };

  const handleMentionClick = (mention) => {
    markAsReadMutation.mutate(mention._id);
    onMentionClick(mention);
  };

  if (isLoading || mentions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">
            New Mentions ({mentions.length})
          </span>
        </div>
        
        <div className="space-y-2">
          {mentions.slice(0, 5).map((mention) => (
            <div
              key={mention._id}
              className="flex items-start gap-3 p-2 bg-primary/10 rounded cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => handleMentionClick(mention)}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {mention.mentionedBy?.firstName?.[0]}{mention.mentionedBy?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm text-foreground">
                  <span className="font-medium">
                    {mention.mentionedBy?.firstName} {mention.mentionedBy?.lastName}
                  </span>
                  {" mentioned you"}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {mention.content}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(mention.createdAt).toLocaleString()}
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAsReadMutation.mutate(mention._id);
                }}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          {mentions.length > 5 && (
            <div className="text-xs text-muted-foreground text-center">
              And {mentions.length - 5} more mentions...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}