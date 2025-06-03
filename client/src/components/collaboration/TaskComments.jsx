import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  MessageCircle,
  Send,
  MoreHorizontal,
  Edit,
  Trash2,
  Reply,
  AtSign,
  Heart,
  Check
} from "lucide-react";

export function TaskComments({ 
  taskId, 
  users = [], 
  currentUser,
  className = "" 
}) {
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["/api/tasks", taskId, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/tasks/${taskId}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
    enabled: !!taskId,
    refetchInterval: 30000 // Refresh every 30 seconds for real-time feel
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentData) => {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...commentData,
          authorId: currentUser._id,
          createdAt: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error("Failed to add comment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/tasks", taskId, "comments"]);
      setNewComment("");
      setReplyingTo(null);
      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add comment",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, content }) => {
      const response = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content,
          updatedAt: new Date().toISOString(),
          isEdited: true
        })
      });
      if (!response.ok) throw new Error("Failed to update comment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/tasks", taskId, "comments"]);
      setEditingComment(null);
      setEditContent("");
      toast({
        title: "Comment updated",
        description: "Your comment has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update comment",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId) => {
      const response = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: "DELETE"
      });
      if (!response.ok) throw new Error("Failed to delete comment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/tasks", taskId, "comments"]);
      setShowDeleteDialog(null);
      toast({
        title: "Comment deleted",
        description: "The comment has been removed."
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete comment",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // React to comment mutation
  const reactToCommentMutation = useMutation({
    mutationFn: async ({ commentId, reaction }) => {
      const response = await fetch(`/api/tasks/${taskId}/comments/${commentId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reaction,
          userId: currentUser._id
        })
      });
      if (!response.ok) throw new Error("Failed to react to comment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/tasks", taskId, "comments"]);
    }
  });

  // Handle comment submission
  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    const mentions = extractMentions(newComment);
    
    addCommentMutation.mutate({
      content: newComment,
      mentions: mentions.map(mention => mention.userId),
      parentId: replyingTo?.id || null
    });
  };

  // Handle comment editing
  const handleEditComment = (comment) => {
    setEditingComment(comment._id);
    setEditContent(comment.content);
  };

  const handleUpdateComment = () => {
    if (!editContent.trim()) return;
    
    updateCommentMutation.mutate({
      commentId: editingComment,
      content: editContent
    });
  };

  // Handle comment deletion
  const handleDeleteComment = (commentId) => {
    deleteCommentMutation.mutate(commentId);
  };

  // Extract mentions from text
  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1];
      const user = users.find(u => 
        u.firstName?.toLowerCase().includes(username.toLowerCase()) ||
        u.lastName?.toLowerCase().includes(username.toLowerCase()) ||
        u.email?.toLowerCase().includes(username.toLowerCase())
      );
      
      if (user) {
        mentions.push({ userId: user._id, username });
      }
    }
    
    return mentions;
  };

  // Render mentions in text
  const renderTextWithMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const parts = text.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a mention
        const user = users.find(u => 
          u.firstName?.toLowerCase().includes(part.toLowerCase()) ||
          u.lastName?.toLowerCase().includes(part.toLowerCase())
        );
        
        if (user) {
          return (
            <Badge key={index} variant="secondary" className="mx-1 text-xs">
              @{user.firstName} {user.lastName}
            </Badge>
          );
        }
      }
      return part;
    });
  };

  // Handle @ mention input
  const handleMentionInput = (e) => {
    const value = e.target.value;
    setNewComment(value);
    
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentions(true);
      setMentionQuery("");
    } else if (lastAtIndex !== -1) {
      const query = value.substring(lastAtIndex + 1);
      if (query.includes(' ')) {
        setShowMentions(false);
      } else {
        setMentionQuery(query);
        setShowMentions(true);
      }
    } else {
      setShowMentions(false);
    }
  };

  // Insert mention
  const insertMention = (user) => {
    const lastAtIndex = newComment.lastIndexOf('@');
    const beforeMention = newComment.substring(0, lastAtIndex);
    const afterMention = newComment.substring(lastAtIndex + mentionQuery.length + 1);
    
    setNewComment(`${beforeMention}@${user.firstName}${user.lastName} ${afterMention}`);
    setShowMentions(false);
    setMentionQuery("");
  };

  // Filter users for mentions
  const filteredUsers = users.filter(user => 
    user._id !== currentUser._id &&
    (user.firstName?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
     user.lastName?.toLowerCase().includes(mentionQuery.toLowerCase()))
  );

  // Group comments by thread
  const groupedComments = comments.reduce((acc, comment) => {
    if (!comment.parentId) {
      acc.push({ ...comment, replies: [] });
    } else {
      const parent = acc.find(c => c._id === comment.parentId);
      if (parent) {
        parent.replies.push(comment);
      }
    }
    return acc;
  }, []);

  if (!taskId) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Comments Header */}
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Add Comment */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              {replyingTo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Reply className="h-4 w-4" />
                  Replying to {replyingTo.author.firstName} {replyingTo.author.lastName}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setReplyingTo(null)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              )}
              
              <div className="relative">
                <Textarea
                  value={newComment}
                  onChange={handleMentionInput}
                  placeholder="Add a comment... Use @username to mention team members"
                  className="bg-input border-border text-foreground placeholder:text-muted-foreground resize-none"
                  rows={3}
                />
                
                {/* Mention Suggestions */}
                {showMentions && filteredUsers.length > 0 && (
                  <Card className="absolute top-full left-0 right-0 z-10 mt-1 bg-popover border-border shadow-lg">
                    <CardContent className="p-2">
                      {filteredUsers.slice(0, 5).map(user => (
                        <div
                          key={user._id}
                          className="flex items-center gap-2 p-2 hover:bg-accent cursor-pointer rounded"
                          onClick={() => insertMention(user)}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-popover-foreground">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AtSign className="h-4 w-4" />
                  Use @ to mention team members
                </div>
                
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {addCommentMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="bg-card border-border animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-3 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groupedComments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No comments yet. Start the conversation!</p>
          </div>
        ) : (
          groupedComments.map((comment) => (
            <div key={comment._id} className="space-y-3">
              {/* Main Comment */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-secondary text-secondary-foreground">
                        {comment.author?.firstName?.[0]}{comment.author?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {comment.author?.firstName} {comment.author?.lastName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                          {comment.isEdited && (
                            <Badge variant="outline" className="text-xs">
                              edited
                            </Badge>
                          )}
                        </div>
                        
                        {comment.author?._id === currentUser._id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border">
                              <DropdownMenuItem 
                                onClick={() => handleEditComment(comment)}
                                className="text-popover-foreground hover:bg-accent"
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => setShowDeleteDialog(comment._id)}
                                className="text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      
                      {editingComment === comment._id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="bg-input border-border text-foreground resize-none"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={handleUpdateComment}
                              disabled={!editContent.trim() || updateCommentMutation.isPending}
                              size="sm"
                            >
                              {updateCommentMutation.isPending ? (
                                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingComment(null);
                                setEditContent("");
                              }}
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="text-foreground whitespace-pre-wrap mb-3">
                            {renderTextWithMentions(comment.content)}
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setReplyingTo(comment)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Reply className="h-4 w-4 mr-1" />
                              Reply
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => reactToCommentMutation.mutate({ 
                                commentId: comment._id, 
                                reaction: 'like' 
                              })}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Heart className="h-4 w-4 mr-1" />
                              {comment.reactions?.like || 0}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="ml-8 space-y-3">
                  {comment.replies.map((reply) => (
                    <Card key={reply._id} className="bg-muted/50 border-border">
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {reply.author?.firstName?.[0]}{reply.author?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-foreground">
                                {reply.author?.firstName} {reply.author?.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            
                            <div className="text-sm text-foreground">
                              {renderTextWithMentions(reply.content)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!showDeleteDialog} onOpenChange={() => setShowDeleteDialog(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-card-foreground">Delete Comment</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDeleteComment(showDeleteDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}